import { useState } from "react";
import { Button, Card, Chip, ErrorText, Screen, Switch, inputClass } from "../components/ui";
import RoomHeader from "../components/RoomHeader";
import { TEAMS, expandSelection, makeCustomRole } from "../roles";
import {
  closeRoom,
  friendlyError,
  removePlayer,
  setCustomRoles,
  setLocked,
  setSelection,
  startGame,
} from "../lib/game";

function CustomRoleForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState("villaggio");

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        + Ruolo personalizzato
      </Button>
    );
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    onAdd(makeCustomRole({ name, description, team }));
    setName("");
    setDescription("");
    setTeam("villaggio");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-slate-700 p-3">
      <input
        className={inputClass}
        placeholder="Nome del ruolo"
        value={name}
        maxLength={32}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className={inputClass}
        placeholder="Spiegazione per il giocatore"
        rows={3}
        value={description}
        maxLength={400}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select className={inputClass} value={team} onChange={(e) => setTeam(e.target.value)}>
        {Object.entries(TEAMS).map(([id, t]) => (
          <option key={id} value={id}>
            Squadra: {t.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          Aggiungi
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

export default function MasterLobby({ code, room, players, config, allRoles, onExit }) {
  const selection = config?.selection ?? {};
  const customRoles = config?.customRoles ?? [];
  const total = Object.values(selection).reduce((a, b) => a + b, 0);
  const missing = players.length - total;

  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  async function safe(fn) {
    setError("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    }
  }

  function changeCount(id, delta) {
    const n = (selection[id] ?? 0) + delta;
    const next = { ...selection };
    if (n <= 0) delete next[id];
    else next[id] = n;
    return safe(() => setSelection(code, next));
  }

  function addCustom(role) {
    return safe(() => setCustomRoles(code, [...customRoles, role], selection));
  }

  function removeCustom(id) {
    const next = { ...selection };
    delete next[id];
    return safe(() =>
      setCustomRoles(
        code,
        customRoles.filter((r) => r.id !== id),
        next,
      ),
    );
  }

  async function start() {
    setStarting(true);
    await safe(() => startGame(code, players, expandSelection(selection, allRoles)));
    setStarting(false);
  }

  function close() {
    if (!window.confirm("Chiudere la stanza? Tutti i dati della partita verranno eliminati.")) return;
    safe(async () => {
      await closeRoom(code);
      onExit();
    });
  }

  let status;
  if (players.length === 0) status = "Nessun giocatore ancora";
  else if (missing > 0) status = `Mancano ${missing} ruoli`;
  else if (missing < 0) status = `Hai ${-missing} ruoli in più`;
  else status = "Tutto pronto";

  return (
    <Screen>
      <RoomHeader code={code} />

      <Card className="space-y-3">
        <h2 className="font-semibold">Giocatori ({players.length})</h2>
        {players.length === 0 ? (
          <p className="text-sm text-slate-400">
            Passa il codice agli altri: compariranno qui appena entrano.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <span>{p.name}</span>
                <button
                  type="button"
                  className="px-2 text-slate-500 hover:text-red-400"
                  aria-label={`Rimuovi ${p.name}`}
                  onClick={() => safe(() => removePlayer(code, p.id))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <Switch
          label="Accetta nuovi giocatori"
          checked={!room.locked}
          onChange={(open) => safe(() => setLocked(code, !open))}
        />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Ruoli</h2>
          <p
            className={`text-sm ${
              missing === 0 && players.length > 0 ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {total} / {players.length} · {status}
          </p>
        </div>

        <ul className="space-y-2">
          {allRoles.map((role) => {
            const count = selection[role.id] ?? 0;
            const team = TEAMS[role.team] ?? TEAMS.villaggio;
            return (
              <li
                key={role.id}
                className={`rounded-xl border p-3 ${
                  count > 0 ? "border-amber-500/50 bg-slate-800/60" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{role.name}</p>
                    <Chip className={team.chip}>{team.label}</Chip>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={count === 0}
                      onClick={() => changeCount(role.id, -1)}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center font-bold">{count}</span>
                    <Button variant="secondary" size="sm" onClick={() => changeCount(role.id, 1)}>
                      +
                    </Button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-400">{role.description}</p>
                {role.custom && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-slate-500 hover:text-red-400"
                    onClick={() => removeCustom(role.id)}
                  >
                    Elimina ruolo
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {missing > 0 && (
          <Button variant="secondary" size="sm" className="w-full" onClick={() => changeCount("paesano", missing)}>
            Completa con {missing} Contadini
          </Button>
        )}

        <CustomRoleForm onAdd={addCustom} />
      </Card>

      <ErrorText>{error}</ErrorText>

      <Button
        className="w-full text-lg"
        disabled={starting || players.length === 0 || missing !== 0}
        onClick={start}
      >
        {starting ? "Distribuisco i ruoli…" : "Inizia la partita"}
      </Button>

      <Button variant="ghost" className="w-full" onClick={close}>
        Chiudi stanza
      </Button>
    </Screen>
  );
}
