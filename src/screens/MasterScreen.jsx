import { Button, Card, Loading, Screen } from "../components/ui";
import { ROLE_LIBRARY } from "../roles";
import { sortPlayers, useCollection, useDocument } from "../lib/hooks";
import MasterBoard from "./MasterBoard";
import MasterLobby from "./MasterLobby";

export default function MasterScreen({ user, code, onExit }) {
  const room = useDocument(["rooms", code]);
  const roster = useCollection(["rooms", code, "players"]);
  const privates = useCollection(["rooms", code, "private"]);
  const config = useDocument(["rooms", code, "secret", "config"]);

  if (
    room === undefined ||
    roster === undefined ||
    privates === undefined ||
    config === undefined
  ) {
    return <Loading />;
  }

  if (room === null || room.masterUid !== user.uid) {
    return (
      <Screen>
        <Card className="space-y-4 text-center">
          <p className="text-lg font-semibold">Stanza non trovata.</p>
          <Button className="w-full" onClick={onExit}>
            Torna alla home
          </Button>
        </Card>
      </Screen>
    );
  }

  const players = sortPlayers(roster);
  const allRoles = [...ROLE_LIBRARY, ...(config?.customRoles ?? [])];

  return room.status === "lobby" ? (
    <MasterLobby
      code={code}
      room={room}
      players={players}
      config={config}
      allRoles={allRoles}
      onExit={onExit}
    />
  ) : (
    <MasterBoard
      code={code}
      room={room}
      players={players}
      privates={privates}
      config={config}
      allRoles={allRoles}
      onExit={onExit}
    />
  );
}
