# Lupus

A helper for playing Werewolf / Lupus in tabula in person. The master creates a room and picks
the roles; every player joins from their own phone with a name and a code and sees only their
own role. The master sees everything and keeps the game state.

Stack: Vite + React + Tailwind, Firebase (Firestore, anonymous auth, Hosting).

## 1. Create the Firebase project (free, ~5 minutes)

1. Open the [Firebase console](https://console.firebase.google.com) and create a project
   (Google Analytics is not needed).
2. **Build -> Firestore Database -> Create database** (production mode, pick a region near you).
3. **Build -> Authentication -> Get started -> Sign-in method -> Anonymous -> Enable.**
4. **Project settings -> Your apps -> Web (`</>`)**: register an app (no Hosting needed in that
   step) and copy the `firebaseConfig` values.
5. Paste them into `src/firebaseConfig.js`.

## 2. Run it locally

```bash
npm install
npm run dev
```

Open the printed address. For a quick test, use one normal window as the master and a second
window (or a private one) as a player; each browser profile counts as a separate player.

## 3. Deploy

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # choose your project
npm run build
firebase deploy           # deploys Hosting and the Firestore rules
```

The security rules in `firestore.rules` are what keep roles private, so make sure the deploy
included them (`firebase deploy --only firestore:rules` to redeploy them alone).

## How it works

| Where | Who can read | What |
| --- | --- | --- |
| `rooms/{code}` | anyone with the code | status, phase, whether new players can join |
| `rooms/{code}/players/{uid}` | everyone in the room | name, alive/dead |
| `rooms/{code}/private/{uid}` | that player + the master | role, conditions |
| `rooms/{code}/secret/config` | master only | selected roles, custom roles |

- Roles are assigned randomly when the master presses **Inizia la partita**.
- The room locks at the start; the master can reopen it. A player who joins late gets a role
  assigned manually from the master's board.
- A player's role card starts hidden (tap to reveal) and hides again when the page goes to the
  background, so nobody sees it by glancing at the phone.
- Players who refresh stay in the room (anonymous sign-in + saved session). The master is
  recognised the same way, on the same browser.

## Adding role images later

Put the files in `public/roles/` and set the `image` field of the role in `src/roles.js`, for
example `image: "roles/lupo.png"`. Until then the card shows a lettered placeholder. Custom
roles can be given an image the same way, or via Firebase Storage if you want the master to
upload them from the app (not built yet).

## Notes

- Keep the Firebase config in the repo: it identifies the project but is not a secret. Access
  is controlled by the Firestore rules.
- Rooms are deleted when the master taps **Chiudi stanza**.
