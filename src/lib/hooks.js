import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Live document. Returns undefined while loading, null if missing or not readable.
export function useDocument(segments) {
  const key = segments ? segments.join("/") : null;
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!key) return undefined;
    setData(undefined);
    return onSnapshot(
      doc(db, ...key.split("/")),
      (snap) => setData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.error(err);
        setData(null);
      },
    );
  }, [key]);

  return data;
}

// Live collection. Returns undefined while loading; [] on error.
export function useCollection(segments) {
  const key = segments ? segments.join("/") : null;
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!key) return undefined;
    setData(undefined);
    return onSnapshot(
      collection(db, ...key.split("/")),
      (snap) => setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(err);
        setData([]);
      },
    );
  }, [key]);

  return data;
}

export function sortPlayers(players) {
  const time = (p) => p.joinedAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
  return [...players].sort((a, b) => time(a) - time(b) || a.name.localeCompare(b.name));
}
