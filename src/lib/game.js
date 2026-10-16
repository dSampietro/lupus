import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { roleSnapshot, shuffle } from "../roles";

// ---------- small helpers ----------

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I / O, easy to read aloud
const CODE_LENGTH = 5;

function randomCode() {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

const roomRef = (code) => doc(db, "rooms", code);
const playerRef = (code, id) => doc(db, "rooms", code, "players", id);
const privateRef = (code, id) => doc(db, "rooms", code, "private", id);
const configRef = (code) => doc(db, "rooms", code, "secret", "config");

// Batches are kept small: each write in a batch triggers a security-rule lookup.
async function commitInChunks(ops, size = 8) {
  for (let i = 0; i < ops.length; i += size) {
    const batch = writeBatch(db);
    ops.slice(i, i + size).forEach((op) => op(batch));
    await batch.commit();
  }
}

export function friendlyError(e) {
  if (e?.code === "permission-denied") {
    return "Operazione non consentita (stanza chiusa o permessi mancanti).";
  }
  if (e?.code === "unavailable") return "Connessione assente. Riprova.";
  return e?.message || "Qualcosa è andato storto.";
}

// ---------- phases ----------

export function phaseLabel(phase) {
  if (!phase || phase.kind === "lobby") return "In attesa";
  return `${phase.kind === "night" ? "Notte" : "Giorno"} ${phase.n}`;
}

export function nextPhase(p) {
  if (p.kind === "night") return { kind: "day", n: p.n };
  return { kind: "night", n: p.n + 1 };
}

export function prevPhase(p) {
  if (p.kind === "day") return { kind: "night", n: p.n };
  if (p.n > 1) return { kind: "day", n: p.n - 1 };
  return p;
}

// ---------- room lifecycle ----------

export async function createRoom(uid) {
  for (let i = 0; i < 8; i++) {
    const code = randomCode();
    const snap = await getDoc(roomRef(code));
    if (snap.exists()) continue;
    await setDoc(roomRef(code), {
      masterUid: uid,
      status: "lobby",
      locked: false,
      phase: { kind: "lobby", n: 0 },
      createdAt: serverTimestamp(),
    });
    await setDoc(configRef(code), { selection: {}, customRoles: [] });
    return code;
  }
  throw new Error("Non sono riuscito a creare la stanza, riprova.");
}

export async function joinRoom(rawCode, rawName, uid) {
  const code = rawCode.trim().toUpperCase();
  const name = rawName.trim();
  if (!name) throw new Error("Inserisci il tuo nome.");
  if (code.length !== CODE_LENGTH) throw new Error("Il codice ha 5 lettere.");

  const room = await getDoc(roomRef(code));
  if (!room.exists()) throw new Error("Stanza non trovata. Controlla il codice.");
  if (room.data().masterUid === uid) {
    throw new Error("Sei il master di questa stanza: usa la schermata del master.");
  }

  // Already joined from this device: just reconnect.
  const existing = await getDoc(playerRef(code, uid));
  if (existing.exists()) return code;

  if (room.data().locked) {
    throw new Error("La stanza è chiusa: chiedi al master di riaprirla.");
  }

  const players = await getDocs(collection(db, "rooms", code, "players"));
  const taken = players.docs.some((d) => d.data().name.toLowerCase() === name.toLowerCase());
  if (taken) throw new Error("Esiste già un giocatore con questo nome.");

  await setDoc(playerRef(code, uid), { name, alive: true, joinedAt: serverTimestamp() });
  return code;
}

export const setLocked = (code, locked) => updateDoc(roomRef(code), { locked });

export const setPhase = (code, phase) => updateDoc(roomRef(code), { phase });

export const leaveRoom = (code, uid) => deleteDoc(playerRef(code, uid));

export async function removePlayer(code, id) {
  await deleteDoc(privateRef(code, id));
  await deleteDoc(playerRef(code, id));
}

// ---------- roles ----------

export const setSelection = (code, selection) => updateDoc(configRef(code), { selection });

export const setCustomRoles = (code, customRoles, selection) =>
  updateDoc(configRef(code), { customRoles, selection });

export const setNotes = (code, notes) => updateDoc(configRef(code), { notes });

// roleList must have exactly one role per player.
export async function startGame(code, players, roleList) {
  if (players.length === 0 || roleList.length !== players.length) {
    throw new Error("Il numero di ruoli deve essere uguale al numero di giocatori.");
  }
  const shuffled = shuffle(roleList);
  const ops = players.map(
    (p, i) => (batch) =>
      batch.set(privateRef(code, p.id), { role: roleSnapshot(shuffled[i]), conditions: [] }),
  );
  await commitInChunks(ops);
  // The room flips to "playing" only after every role has been written.
  await updateDoc(roomRef(code), {
    status: "playing",
    locked: true,
    phase: { kind: "night", n: 1 },
  });
}

// Manual assignment, e.g. for someone who joined after the game started.
export const assignRole = (code, id, role) =>
  setDoc(privateRef(code, id), { role: roleSnapshot(role), conditions: [] });

// ---------- during the game ----------

export const setAlive = (code, id, alive) => updateDoc(playerRef(code, id), { alive });

export const addCondition = (code, id, tag) =>
  updateDoc(privateRef(code, id), { conditions: arrayUnion(tag) });

export const removeCondition = (code, id, tag) =>
  updateDoc(privateRef(code, id), { conditions: arrayRemove(tag) });

// Back to the lobby with the same players: roles are cleared, everyone is alive again.
export async function resetGame(code) {
  const [privs, players] = await Promise.all([
    getDocs(collection(db, "rooms", code, "private")),
    getDocs(collection(db, "rooms", code, "players")),
  ]);
  const ops = [
    ...privs.docs.map((d) => (batch) => batch.delete(d.ref)),
    ...players.docs.map((d) => (batch) => batch.update(d.ref, { alive: true })),
  ];
  await commitInChunks(ops);
  await updateDoc(configRef(code), { nightChecks: { notes: "" } });
  await updateDoc(roomRef(code), {
    status: "lobby",
    locked: false,
    phase: { kind: "lobby", n: 0 },
  });
}

// Deletes everything for the room. The room document goes last because the
// security rules need it to recognise the master.
export async function closeRoom(code) {
  const [privs, players] = await Promise.all([
    getDocs(collection(db, "rooms", code, "private")),
    getDocs(collection(db, "rooms", code, "players")),
  ]);
  const ops = [...privs.docs, ...players.docs].map((d) => (batch) => batch.delete(d.ref));
  await commitInChunks(ops);
  await deleteDoc(configRef(code));
  await deleteDoc(roomRef(code));
}


export const setNightOrder = (code, nightOrder) => updateDoc(configRef(code), { nightOrder });

export const setFirstNightOnly = (code, firstNightOnly) =>
  updateDoc(configRef(code), { firstNightOnly });

export const setNightChecks = (code, night, done) =>
  updateDoc(configRef(code), { nightChecks: { night, done } });

export const setNightRemoved = (code, nightRemoved) =>
  updateDoc(configRef(code), { nightRemoved });