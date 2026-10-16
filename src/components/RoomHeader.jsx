import { useState } from "react";
import { Card } from "./ui";

export default function RoomHeader({ code, children }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available: the code is on screen anyway
    }
  }

  return (
    <Card className="text-center">
      <p className="text-xs uppercase tracking-widest text-slate-400">Codice stanza</p>
      <button
        type="button"
        onClick={copy}
        className="mt-1 text-5xl font-black tracking-[0.25em] text-amber-400"
      >
        {code}
      </button>
      <p className="mt-1 text-xs text-slate-500">{copied ? "Copiato!" : "Tocca per copiare"}</p>
      {children}
    </Card>
  );
}
