import { TEAMS, roleImageUrl } from "../roles";
import { Chip } from "./ui";

// The one place where a role is displayed to a player.
// To add pictures later, only RoleImage needs to change (and role.image to be filled in).
function RoleImage({ role }) {
  const url = roleImageUrl(role.image);
  const team = TEAMS[role.team] ?? TEAMS.villaggio;
  if (url) {
    return (
      <img src={url} alt="" className="mx-auto h-44 w-44 rounded-2xl object-cover" />
    );
  }
  return (
    <div
      className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-5xl font-black ${team.soft}`}
    >
      {role.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function RoleCard({ role, revealed, onToggle }) {
  const team = TEAMS[role.team] ?? TEAMS.villaggio;
  return (
    <button type="button" onClick={onToggle} className="block w-full text-left">
      <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
        <div className={`h-2 ${revealed ? team.accent : "bg-slate-700"}`} />
        {revealed ? (
          <div className="space-y-4 p-5">
            <RoleImage role={role} />
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">{role.name}</h2>
              <Chip className={team.chip}>{team.label}</Chip>
            </div>
            <p className="leading-relaxed text-slate-300">{role.description}</p>
            <p className="text-center text-xs text-slate-500">Tocca per nascondere</p>
          </div>
        ) : (
          <div className="space-y-2 px-5 py-14 text-center">
            <div className="text-5xl">🐺</div>
            <p className="text-lg font-semibold">Il tuo ruolo è nascosto</p>
            <p className="text-sm text-slate-400">Tocca per svelarlo</p>
          </div>
        )}
      </div>
    </button>
  );
}
