import { useEffect, useState } from "react";
import { Button, Card, Chip, Loading, Screen } from "../components/ui";
import PlayerList from "../components/PlayerList";
import RoleCard from "../components/RoleCard";
import { useCollection, useDocument, sortPlayers } from "../lib/hooks";
import { leaveRoom, phaseLabel } from "../lib/game";

export default function PlayerScreen({ user, code, onExit }) {
  const room = useDocument(["rooms", code]);
  const roster = useCollection(["rooms", code, "players"]);
  const me = useDocument(["rooms", code, "players", user.uid]);
  const priv = useDocument(["rooms", code, "private", user.uid]);
  const [revealed, setRevealed] = useState(false);

  const roleId = priv?.role?.id;

  // Hide the card again whenever the role changes (new game)...
  useEffect(() => {
    setRevealed(false);
  }, [roleId]);

  // ...and whenever the page goes to the background, so a glance at the phone shows nothing.
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setRevealed(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  if (room === undefined || roster === undefined || me === undefined || priv === undefined) {
    return <Loading />;
  }

  if (room === null || me === null) {
    return (
      <Screen>
        <Card className="space-y-4 text-center">
          <p className="text-lg font-semibold">
            {room === null ? "La stanza è stata chiusa." : "Sei stato rimosso dalla stanza."}
          </p>
          <Button className="w-full" onClick={onExit}>
            Torna alla home
          </Button>
        </Card>
      </Screen>
    );
  }

  const started = room.status !== "lobby";
  const players = sortPlayers(roster);

  async function leave() {
    try {
      await leaveRoom(code, user.uid);
    } catch (e) {
      console.error(e);
    }
    onExit();
  }

  return (
    <Screen>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Stanza {code}</p>
          <h1 className="truncate text-xl font-bold">{me.name}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Chip className="bg-slate-800 text-slate-200">{phaseLabel(room.phase)}</Chip>
          {started && (
            <Chip
              className={
                me.alive
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-slate-800 text-slate-400"
              }
            >
              {me.alive ? "Vivo" : "Morto"}
            </Chip>
          )}
        </div>
      </header>

      {started && priv?.role ? (
        <RoleCard
          role={priv.role}
          revealed={revealed}
          onToggle={() => setRevealed((r) => !r)}
        />
      ) : (
        <Card className="space-y-1 py-10 text-center">
          <div className="text-4xl">⏳</div>
          <p className="font-semibold">
            {started
              ? "Il master ti assegnerà un ruolo a breve."
              : "In attesa che il master distribuisca i ruoli…"}
          </p>
        </Card>
      )}

      {started && priv?.conditions?.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Condizioni</h2>
          <div className="flex flex-wrap gap-2">
            {priv.conditions.map((c) => (
              <Chip key={c} className="bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
                {c}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-300">
          Giocatori ({players.filter((p) => p.alive).length} vivi su {players.length})
        </h2>
        <PlayerList players={players} meId={user.uid} />
      </Card>

      {!started && (
        <Button variant="ghost" className="w-full" onClick={leave}>
          Esci dalla stanza
        </Button>
      )}
    </Screen>
  );
}
