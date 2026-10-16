import { useEffect, useState } from "react";
import { Button, Card, Chip, ErrorText, Switch } from "./ui";
import { TEAMS, fullNightOrder } from "../roles";
import { friendlyError, setFirstNightOnly, setNightOrder, setNightRemoved } from "../lib/game";

export default function NightCallSheet({ code, config, phase, players, privById, allRoles }) {
  const [open, setOpen] = useState(phase.kind === "night");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOpen(phase.kind === "night");
  }, [phase.kind]);

  async function safe(fn) {
    setError("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    }
  }

  const roleById = new Map(allRoles.map((r) => [r.id, r]));

  const inPlayIds = new Set(players.map((p) => privById[p.id]?.role?.id).filter(Boolean));

  const order = fullNightOrder(allRoles, config?.nightOrder);
  const removed = config?.nightRemoved ?? [];

  const inPlay = order.map((id) => roleById.get(id)).filter((r) => r && inPlayIds.has(r.id));
  const listed = inPlay.filter((r) => !removed.includes(r.id));
  const excluded = inPlay.filter((r) => removed.includes(r.id));

  const firstNightOnly = (role) => config?.firstNightOnly?.[role.id] ?? role.firstNight ?? false;
  const visible = editing ? listed : listed.filter((r) => phase.n <= 1 || !firstNightOnly(r));
  const hiddenCount = listed.length - visible.length;

  function move(id, direction) {
    const ids = listed.map((r) => r.id);
    const i = ids.indexOf(id);
    const j = i + direction;
    if (j < 0 || j >= ids.length) return;
    const full = [...order];
    const a = full.indexOf(ids[i]);
    const b = full.indexOf(ids[j]);
    [full[a], full[b]] = [full[b], full[a]];
    safe(() => setNightOrder(code, full));
  }

  function remove(id) {
    safe(() => setNightRemoved(code, [...removed, id]));
  }

  function restore(id) {
    safe(() => setNightRemoved(code, removed.filter((x) => x !== id)));
  }

  function setFirstOnly(id, value) {
    safe(() => setFirstNightOnly(code, { ...(config?.firstNightOnly ?? {}), [id]: value }));
  }

  return (
    <Card className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="font-semibold">Chiamata notturna</h2>
        <span className="text-xs text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          {visible.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun ruolo da chiamare questa notte.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((role, i) => {
                const team = TEAMS[role.team] ?? TEAMS.villaggio;
                return (
                  <li
                    key={role.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 p-3"
                  >
                    {editing && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Sposta ${role.name} su`}
                          disabled={i === 0}
                          onClick={() => move(role.id, -1)}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Sposta ${role.name} giù`}
                          disabled={i === visible.length - 1}
                          onClick={() => move(role.id, 1)}
                        >
                          ▼
                        </Button>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {i + 1}. {role.name}
                        </p>
                        <Chip className={team.chip}>{team.label}</Chip>
                      </div>
                      {editing && (
                        <div className="space-y-1 pt-1">
                          <Switch
                            label="Solo prima notte"
                            checked={firstNightOnly(role)}
                            onChange={(value) => setFirstOnly(role.id, value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-0"
                            onClick={() => remove(role.id)}
                          >
                            Togli dalla chiamata
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {editing && excluded.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-400">Tolti dalla chiamata (tocca per rimetterli)</p>
              <div className="flex flex-wrap gap-2">
                {excluded.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => restore(role.id)}
                    className="rounded-full border border-dashed border-slate-600 px-2.5 py-1 text-xs text-slate-300"
                  >
                    + {role.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!editing && hiddenCount > 0 && (
            <p className="text-xs text-slate-500">
              {hiddenCount === 1
                ? "1 ruolo solo prima notte non è mostrato."
                : `${hiddenCount} ruoli solo prima notte non sono mostrati.`}
            </p>
          )}

          <ErrorText>{error}</ErrorText>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Fine" : "Modifica ordine"}
          </Button>
        </>
      )}
    </Card>
  );
}