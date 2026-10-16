import { useState } from "react";
import { Button, Card, ErrorText, Screen, inputClass } from "../components/ui";
import { createRoom, friendlyError, joinRoom } from "../lib/game";

export default function Home({ user, onSession }) {
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem("lupus-name") ?? "";
    } catch {
      return "";
    }
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const joined = await joinRoom(code, name, user.uid);
      try {
        localStorage.setItem("lupus-name", name.trim());
      } catch {
        // ignore storage errors
      }
      onSession({ mode: "player", code: joined });
    } catch (err) {
      console.error(err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      const created = await createRoom(user.uid);
      onSession({ mode: "master", code: created });
    } catch (err) {
      console.error(err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <header className="space-y-1 pb-4 pt-8 text-center">
        <div className="text-6xl">🐺</div>
        <h1 className="text-4xl font-black tracking-tight">Lupus</h1>
        <p className="text-slate-400">Il tuo ruolo, sul tuo telefono.</p>
      </header>

      <Card>
        <form onSubmit={join} className="space-y-3">
          <h2 className="font-semibold">Entra in una partita</h2>
          <input
            className={inputClass}
            placeholder="Il tuo nome"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <input
            className={`${inputClass} text-center text-2xl font-bold uppercase tracking-[0.3em]`}
            placeholder="CODICE"
            value={code}
            maxLength={5}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <Button type="submit" className="w-full" disabled={busy || !name.trim() || code.length !== 5}>
            Entra
          </Button>
        </form>
      </Card>

      <ErrorText>{error}</ErrorText>

      <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-widest text-slate-600">
        <span className="h-px flex-1 bg-slate-800" />
        oppure
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <Button variant="secondary" className="w-full" onClick={create} disabled={busy}>
        Sono il master: crea una stanza
      </Button>
    </Screen>
  );
}
