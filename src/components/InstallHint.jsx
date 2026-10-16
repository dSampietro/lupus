import { useEffect, useState } from "react";
import { Button } from "./ui";

const DISMISSED_KEY = "lupus-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallHint() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (dismissed || isStandalone()) return null;

  const showIOSHint = isIOS() && !deferred;
  if (!deferred && !showIOSHint) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="min-w-0">
        {deferred
          ? "Installa Lupus sul telefono per aprirlo come un'app."
          : "Per installarla: tocca Condividi, poi \u201cAggiungi alla schermata Home\u201d."}
      </p>
      <div className="flex shrink-0 gap-2">
        {deferred && (
          <Button
            size="sm"
            onClick={async () => {
              deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
            }}
          >
            Installa
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={dismiss}>
          {deferred ? "No" : "Ok"}
        </Button>
      </div>
    </div>
  );
}