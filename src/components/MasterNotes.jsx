import { useEffect, useRef, useState } from "react";
import { Button, Card, inputClass } from "./ui";
import { phaseLabel, setNotes } from "../lib/game";

export default function MasterNotes({ code, saved, phase }) {
  const [text, setText] = useState(saved ?? "");
  const [status, setStatus] = useState("saved"); // saved | pending | error
  const dirty = useRef(false);
  const timer = useRef(null);
  const latest = useRef(saved ?? "");
  const box = useRef(null);

  useEffect(() => {
    if (!dirty.current) {
      setText(saved ?? "");
      latest.current = saved ?? "";
    }
  }, [saved]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (dirty.current) setNotes(code, latest.current).catch(() => {});
    },
    [code],
  );

  async function save() {
    clearTimeout(timer.current);
    const sent = latest.current;
    setStatus("pending");
    try {
      await setNotes(code, sent);
      if (latest.current === sent) dirty.current = false;
      setStatus("saved");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  function change(value) {
    setText(value);
    latest.current = value;
    dirty.current = true;
    setStatus("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 800);
  }

  function clear() {
    if (!window.confirm("Svuotare tutte le note?")) return;
    change("");
    save();
  }

  const label = { saved: "Salvato", pending: "Salvataggio…", error: "Errore di salvataggio" }[status];

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Note del master</h2>
        <span className={`text-xs ${status === "error" ? "text-red-300" : "text-slate-500"}`}>
          {label}
        </span>
      </div>
      <textarea
        ref={box}
        className={`${inputClass} min-h-40 resize-y leading-relaxed`}
        rows={7}
        value={text}
        maxLength={20000}
        placeholder="Es. Notte 2: i lupi scelgono Franco, il dottore protegge Mimmo…"
        onChange={(e) => change(e.target.value)}
        onBlur={() => dirty.current && save()}
      />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!text} onClick={clear}>
          Svuota
        </Button>
      </div>
      <p className="text-xs text-slate-500">Visibili solo a te. Si cancellano con "Nuova partita".</p>
    </Card>
  );
}