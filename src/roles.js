// Role library. Every role (built-in or custom) has the same shape:
//   id, name, team, wolf, description, image
// `image` is optional. To add pictures later, drop files into public/roles/
// and set e.g. image: "roles/lupo.png" (or a full https:// URL).

export const TEAMS = {
  villaggio: {
    label: "Villaggio",
    chip: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    accent: "bg-emerald-500",
    soft: "bg-emerald-500/20 text-emerald-300",
  },
  lupi: {
    label: "Lupi",
    chip: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
    accent: "bg-red-500",
    soft: "bg-red-500/20 text-red-300",
  },
  solitario: {
    label: "Solitario",
    chip: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
    accent: "bg-violet-500",
    soft: "bg-violet-500/20 text-violet-300",
  },
};

export const ROLE_LIBRARY = [
  {
    id: "lupo",
    name: "Lupo",
    team: "lupi",
    wolf: true,
    image: null,
    description:
      "Ogni notte ti svegli con gli altri lupi e scegliete insieme una vittima da sbranare. Di giorno fingi di essere un innocente e cerchi di non farti scoprire. Il branco vince quando i lupi sono tanti quanti (o più) degli altri giocatori.",
  },
  {
    id: "lupo_sciam",
    name: "Lupo Sciamano",
    team: "lupi",
    wolf: true,
    image: null,
    description:
      "Ogni notte scegli un giocatore da sciamanizzare; al veggente apparirà cattivo. Poi ti svegli con gli altri lupi e scegliete insieme una vittima da sbranare. Di giorno fingi di essere un innocente e cerchi di non farti scoprire. Il branco vince quando i lupi sono tanti quanti (o più) degli altri giocatori.",
  },
  {
    id: "paesano",
    name: "Paesano",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Non hai poteri speciali. La tua arma è l'intuito: ascolta, ragiona e usa il voto del giorno per smascherare i lupi.",
  },
  {
    id: "veggente",
    name: "Veggente",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Ogni notte indichi un giocatore e il master ti rivela se è buono (👍🏻) o cattivo(👎🏻). Usa queste informazioni con prudenza: se i lupi ti scoprono, sei il primo bersaglio.",
  },
  {
    id: "dottore",
    name: "Dottore",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Ogni notte scegli un giocatore da proteggere: se i lupi lo attaccano, si salva. Le regole su protezioni ripetute o su te stesso le decide il master.",
  },
  {
    id: "joker",
    name: "Pazzo",
    team: "solitario",
    wolf: false,
    image: null,
    description:
      "Giochi da solo. Vinci se ti fai votare dal villaggio.",
  },
  {
    id: "artigliere",
    name: "Artigliere",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Una sola volta per partita, puoi sparare un giocatore a tua scelta. Le regole su colpi aggiuntivi le decide il master.",
  },
  {
    id: "cittmal",
    name: "Cittadino Maledetto",
    team: "solitario",
    wolf: false,
    image: null,
    description:
      "Inizialmente sei con il villaggio, ma una maledizione ti affligge: se i lupi ti scelgono, diventi uno di loro.",
  },

  {
    id: "medium",
    name: "Medium",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Una sola volta per partita, durante il giorno puoi far parlare l'ultimo giocatore ucciso.",
  },
  {
    id: "cupido",
    name: "Cupido",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Alla prima notte scegli due giocatori che diventano Innamorati. Se uno dei due muore, anche l'altro muore di dolore.",
  },
  {
    id: "puttana",
    name: "Puttana",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Durante la notte, scegli un giocatore con cui divertirti. Se i lupi vengono da te, ti salvi; se puntano su di lui, morite entrambi.",
  },
  {
    id: "massone",
    name: "Massone",
    team: "villaggio",
    wolf: false,
    image: null,
    description:
      "Alla prima notte il master ti fa riconoscere gli altri massoni. Siete sicuramente innocenti: potete fidarvi gli uni degli altri.",
  },
];

export function makeCustomRole({ name, description, team }) {
  return {
    id: `custom-${Date.now().toString(36)}`,
    name: name.trim(),
    team,
    wolf: team === "lupi",
    image: null,
    description: description.trim(),
    custom: true,
  };
}

// Only these fields are copied into a player's private document.
export function roleSnapshot(role) {
  return {
    id: role.id,
    name: role.name,
    team: role.team,
    wolf: !!role.wolf,
    image: role.image ?? null,
    description: role.description,
  };
}

// { lupo: 2, paesano: 3 } -> [lupo, lupo, paesano, paesano, paesano]
export function expandSelection(selection, roles) {
  const byId = new Map(roles.map((r) => [r.id, r]));
  const out = [];
  for (const [id, count] of Object.entries(selection)) {
    const role = byId.get(id);
    if (!role) continue;
    for (let i = 0; i < count; i++) out.push(role);
  }
  return out;
}

function randomInt(max) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function roleImageUrl(image) {
  if (!image) return null;
  if (/^https?:\/\//.test(image)) return image;
  return `${import.meta.env.BASE_URL}${image.replace(/^\//, "")}`;
}

export function fullNightOrder(roles, saved = []) {
    const ids = roles.map((r) => r.id);
    const known = new Set(ids);
    const out = [];
    for (const id of [...saved, ...DEFAULT_NIGHT_ORDER]) {
      if (known.has(id) && !out.includes(id)) out.push(id);
    }
    for (const id of ids) {
      if (!out.includes(id)) out.push(id);
    }
    return out;
  }

export const DEFAULT_NIGHT_ORDER = [
  "cupido",
  "massone",
  "lupo",
  "guardia",
  "puttana",
  "veggente",
];