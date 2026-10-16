export default function PlayerList({ players, meId }) {
  return (
    <ul className="divide-y divide-slate-800">
      {players.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-2.5">
          <span className={p.alive ? "" : "text-slate-500 line-through"}>
            {p.name}
            {p.id === meId && <span className="ml-2 text-xs text-slate-500">(tu)</span>}
          </span>
          <span
            className={`text-xs font-medium ${p.alive ? "text-emerald-400" : "text-slate-500"}`}
          >
            {p.alive ? "Vivo" : "Morto"}
          </span>
        </li>
      ))}
    </ul>
  );
}
