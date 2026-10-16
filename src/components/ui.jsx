const VARIANTS = {
  primary: "bg-amber-500 text-slate-950 hover:bg-amber-400",
  secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
  danger: "bg-red-600 text-white hover:bg-red-500",
  ghost: "bg-transparent text-slate-400 hover:text-slate-200",
};

const SIZES = {
  md: "px-4 py-3",
  sm: "px-3 py-2 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900 p-4 ${className}`}
      {...props}
    />
  );
}

export function Chip({ className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function Screen({ children }) {
  return <main className="mx-auto min-h-dvh max-w-md space-y-4 px-4 py-6">{children}</main>;
}

export function Loading({ text = "Caricamento…" }) {
  return (
    <Screen>
      <p className="py-24 text-center text-slate-400">{text}</p>
    </Screen>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{children}</p>;
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-amber-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none";
