import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, isConfigured } from "./firebase";
import { Card, Loading, Screen } from "./components/ui";
import Home from "./screens/Home";
import MasterScreen from "./screens/MasterScreen";
import PlayerScreen from "./screens/PlayerScreen";

const SESSION_KEY = "lupus-session";

function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    return s?.code && s?.mode ? s : null;
  } catch {
    return null;
  }
}

function SetupNeeded() {
  return (
    <Screen>
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Manca la configurazione di Firebase</h1>
        <p className="text-slate-300">
          Apri <code className="text-amber-300">src/firebaseConfig.js</code> e incolla la
          configurazione della tua web app Firebase. I passaggi sono nel README.
        </p>
      </Card>
    </Screen>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [session, setSessionState] = useState(loadSession);

  function setSession(next) {
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // storage unavailable: the session just won't survive a refresh
    }
    setSessionState(next);
  }

  useEffect(() => {
    if (!isConfigured) return undefined;
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((e) => {
          console.error(e);
          setAuthError(
            e.code === "auth/operation-not-allowed"
              ? "Abilita l'accesso anonimo in Firebase: Authentication → Metodo di accesso → Anonimo."
              : e.message,
          );
        });
      }
    });
  }, []);

  if (!isConfigured) return <SetupNeeded />;

  if (authError) {
    return (
      <Screen>
        <Card className="space-y-2">
          <h1 className="text-xl font-bold">Impossibile accedere</h1>
          <p className="text-slate-300">{authError}</p>
        </Card>
      </Screen>
    );
  }

  if (!user) return <Loading />;

  if (session?.mode === "master") {
    return <MasterScreen user={user} code={session.code} onExit={() => setSession(null)} />;
  }
  if (session?.mode === "player") {
    return <PlayerScreen user={user} code={session.code} onExit={() => setSession(null)} />;
  }
  return <Home user={user} onSession={setSession} />;
}
