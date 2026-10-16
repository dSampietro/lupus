import { useState } from "react";
import { Button, Card, ErrorText, Screen, Switch, inputClass } from "../components/ui";
import MasterNotes from "../components/MasterNotes";
import NightCallSheet from "../components/NightCallSheet";
import RoomHeader from "../components/RoomHeader";
import { TEAMS } from "../roles";
import {
  addCondition,
  assignRole,
  closeRoom,
  friendlyError,
  nextPhase,
  phaseLabel,
  prevPhase,
  removeCondition,
  resetGame,
  setAlive,
  setLocked,
  setPhase,
} from "../lib/game";

const SUGGESTIONS = ["Convertito", "Innamorato", "Silenziato", "Avvelenato"];

function PlayerRow({ code, player, priv, allRoles }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const role = priv?.role;
  const team = TEAMS[role?.team] ?? TEAMS.villaggio;
  const conditions = priv?.conditions ?? [];

  async function safe(fn) {
    setError("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    }
  }

  function add(tag) {
    const t = tag.trim();
    if (t) safe(() => addCondition(code, player.id, t));
    setText("");
    setAdding(false);
  }

  return (
    <li
      className={`rounded-2xl border border-slate-800 bg-slate-900 p-3 ${
        player.alive ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate font-semibold ${player.alive ? "" : "line-through"}`}>
            {player.name}
          </p>
          {role ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${team.chip}`}
            >
              {role.name}
            </button>
          ) : (
            <p className="mt-1 text-xs text-amber-300">Nessun ruolo assegnato</p>
          )}
        </div>
        <Button
          size="sm"
          variant={player.alive ? "secondary" : "primary"}
          className="shrink-0"
          onClick={() => safe(() => setAlive(code, player.id, !player.alive))}
        >
          {player.alive ? "Uccidi" : "Riporta in vita"}
        </Button>
      </div>

      {open && role && <p className="mt-2 text-sm text-slate-400">{role.description}</p>}

      {!role && (
        <select
          className={`${inputClass} mt-2`}
          defaultValue=""
          onChange={(e) => {
            const picked = allRoles.find((r) => r.id === e.target.value);
            if (picked) safe(() => assignRole(code, player.id, picked));
          }}
        >
          <option value="" disabled>
            Assegna un ruolo…
          </option>
          {allRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}

      {priv && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {conditions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => safe(() => removeCondition(code, player.id, c))}
                className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300 ring-1 ring-amber-500/30"
              >
                {c} ✕
              </button>
            ))}
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="rounded-full border border-dashed border-slate-600 px-2.5 py-1 text-xs text-slate-400"
              >
                + Condizione
              </button>
            )}
          </div>

          {adding && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.filter((s) => !conditions.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  add(text);
                }}
                className="flex gap-2"
              >
                <input
                  className={inputClass}
                  placeholder="Altra condizione…"
                  value={text}
                  maxLength={24}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" size="sm">
                  Aggiungi
                </Button>
              </form>
              <button
                type="button"
                className="text-xs text-slate-500"
                onClick={() => {
                  setText("");
                  setAdding(false);
                }}
              >
                Annulla
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </li>
  );
}

export default function MasterBoard({ code, room, players, privates, config, allRoles, onExit }) {
  const [error, setError] = useState("");

  async function safe(fn) {
    setError("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    }
  }

  const privById = Object.fromEntries(privates.map((p) => [p.id, p]));
  const alive = players.filter((p) => p.alive);
  const wolvesAlive = alive.filter((p) => privById[p.id]?.role?.wolf).length;
  const phase = room.phase;

  function newGame() {
    if (!window.confirm("Nuova partita? I ruoli e le note vengono cancellati e tutti tornano in vita.")) return;
    safe(() => resetGame(code));
  }

  function close() {
    if (!window.confirm("Chiudere la stanza? Tutti i dati della partita verranno eliminati.")) return;
    safe(async () => {
      await closeRoom(code);
      onExit();
    });
  }

  return (
    <Screen>
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Fase precedente"
            disabled={phase.kind === "night" && phase.n <= 1}
            onClick={() => safe(() => setPhase(code, prevPhase(phase)))}
          >
            ◀
          </Button>
          <div className="text-center">
            <p className="text-2xl font-black">{phaseLabel(phase)}</p>
            <p className="text-xs text-slate-400">
              Vivi {alive.length} · Morti {players.length - alive.length} · Lupi vivi {wolvesAlive}
            </p>
          </div>
          <Button
            size="sm"
            aria-label="Fase successiva"
            onClick={() => safe(() => setPhase(code, nextPhase(phase)))}
          >
            ▶
          </Button>
        </div>
      </Card>

        <NightCallSheet
          code={code}
          config={config}
          phase={phase}
          players={players}
          privById={privById}
          allRoles={allRoles}
        />

      <ul className="space-y-2">
        {players.map((p) => (
          <PlayerRow key={p.id} code={code} player={p} priv={privById[p.id]} allRoles={allRoles} />
        ))}
      </ul>

      <ErrorText>{error}</ErrorText>

      <MasterNotes code={code} saved={config?.notes} phase={phase} />

      <RoomHeader code={code} />

      <Card>
        <Switch
          label="Accetta nuovi giocatori"
          checked={!room.locked}
          onChange={(open) => safe(() => setLocked(code, !open))}
        />
      </Card>

      <Button variant="secondary" className="w-full" onClick={newGame}>
        Nuova partita (stessa stanza)
      </Button>
      <Button variant="ghost" className="w-full" onClick={close}>
        Chiudi stanza
      </Button>
    </Screen>
  );
}
