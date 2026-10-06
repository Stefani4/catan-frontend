# 🏝️ Catan Frontend

Web client for an online Settlers of Catan game, built with React and Vite. Connects to the [Catan backend](../catan-backend) over Socket.IO to create/join matches and renders the full game in real time, including AI bot opponents that run locally in the browser.

## 📌 Functionalities

**Main menu** — set up a player profile (name, avatar, color), then create a new match or join an existing one by match ID/link.

**Lobby & match setup** — new matches are configurable via `GameSetupModal.jsx`: victory point target (10/15/20), dice mode (two dice vs. spinning wheel), map size (standard 19-hex vs. large 37-hex), and toggles for seasons, robber-pay-to-clear, and resorts. The lobby supports adding AI bot opponents to fill empty seats.

**In-match UI:**
- Procedurally generated hex board with harbors (`Board.jsx`, `Hex.jsx`, `GamePieces.jsx`, `HarborMarker.jsx`)
- Dice rolling with animation (`DiceRoller.jsx`)
- Resource hand display (`ResourceHand.jsx`) and a build-cost reference panel (`BuildCostsPanel.jsx`)
- Bank and player-to-player trading (`Trading.jsx`)
- Per-player stats sidebar — VPs, Longest Road, Largest Army (`PlayerStats.jsx`)
- In-game chat (`Chat.jsx`) and a turn timer (`TurnTimer.jsx`)
- A victory screen once a player wins (`VictoryModal.jsx`), followed by an end-of-game **summary stats** screen (`PostGameStats.jsx`) breaking down each player's final resources, buildings, and Victory Point sources
- An in-app **Rules reference** (`RulesBook.jsx`) and an interactive **Tutorial** with its own mini demo board (`Tutorial.jsx`)

**Custom board editor** — `BoardEditor.jsx` lets the host hand-design the board before starting a match instead of using the standard random layout: click a hex to cycle through terrain types (using the same resource artwork as the in-game board), click its number token to set the dice number, drag one hex onto another to swap them, or hit "Randomize" to auto-generate a fresh layout. The custom layout is saved with the match's other setup options.

**Game modes** — the host picks a mode in `GameSetupModal.jsx`; the mode is just a preset layered on the normal settings and is enforced by `normalizeGameSettings()` in `game/constants.js`, so the rules engine (not the client) owns the forced values:
- **Blitz** — Compact 12-hex board, first to **6 VP**, and a 30 s action timer (every client caps its own timer at the mode's value).
- **Draft** — replaces the second-settlement resource grant with a Magic-style **pack-passing draft** (`game/draft.js`, `DraftPanel.jsx`). Each player gets a pack of 6 cards (hex claims + resource bundles); everyone picks one *simultaneously*, then packs rotate; 4 rounds. A claimed hex pays its owner **+1 card whenever its number is rolled**, with or without a building on it. Other players' packs are hidden by `playerView`. A 40 s client-side auto-pick keeps an idle player from stalling the table.
- **Shrinking** — the coastline floods inward (`game/flood.js`). The next tide's hexes are **telegraphed** (`G.flood.pending`, shown on the board and in the header). Flooded hexes stop producing, can't hold the robber, and vertices/edges touching only flooded hexes can't be built on; existing buildings stay. After the last tide there is a one-round grace period, then the **VP leader wins** — this guarantees the mode always finishes. Bots avoid doomed hexes.

**Cosmetics economy** — `src/economy/`: players earn **gold** from finishing matches (+15), winning (+60) and one-time **achievements**, and spend it in the **Shop** (`Shop.jsx`, opened from the main menu) on board themes, piece skins and avatar frames. Layers: `catalog.js` (items), `ledger.js` (pure, immutable wallet transitions — every balance change is a ledger entry, idempotency keys prevent double-paying a match, an invariant check detects tampering), `rewards.js` (earning rules: mode multipliers, bot-only matches pay half, a daily match-income cap, achievements), and `walletStore.js` (localStorage persistence with corruption backup). Piece skins and frames travel inside the player identity string so other players see them; board themes are local to the viewer. Skins never shift hue, so team colours stay readable.

**Rulebook** — the game modes and the economy are documented in the in-game rulebook (`rulesPages` in each `locales/*.json`): a new 8-page section right after *Victory Points*, in all five languages, plus short pointers on the Objective, Setup and End-of-game pages. The book pairs odd pages on the left, so the section starts on an odd index and has an even page count to keep related pages on one spread. `__tests__/rulebook.test.js` fails if the text's numbers (VP target, timers, tide schedule, reward amounts…) drift from the game constants.

> The wallet lives in `localStorage`, so it is **not tamper-proof** — fine for cosmetics, but a server-side ledger (the pure `ledger.js` / `rewards.js` modules are written to be reusable there) would be required before gold could carry any real value.

**Bots** — `bots/botEngine.js` is a heuristic AI that evaluates the current game state and picks moves (building, trading, robber placement, etc.); `bots/BotManager.jsx` spins up a `botClient.js` instance per bot seat and drives it automatically during a match.

**Profile, settings & session persistence** — `profileStore.js` and `settingsStore.js` persist the player's identity and app preferences (like the FPS overlay and animation toggle) locally; `matchSession.js` saves the current match ID, seat, and credentials so refreshing the page rejoins the match in progress instead of losing it.

**Mobile responsiveness / PWA** *(work in progress, not fully functional)* — the app is configured as an installable Progressive Web App via `vite-plugin-pwa` (manifest, icons, offline service worker), and the main menu, lobby, and in-match screens each have a stacked mobile layout (`useViewportSize.js`) that kicks in on narrow or portrait viewports instead of the desktop 3-column layout. Coverage is still incomplete — some screens/components may not yet adapt correctly on every device.

## 🌐 Technologies

- **React 19** + **Vite 7**
- **[boardgame.io](https://boardgame.io/)** client + `SocketIO` transport for real-time multiplayer sync with the backend
- **Vitest** + **React Testing Library** for testing
- Plain CSS — no UI framework

## 🧩 Architecture Overview

```
game/                  # Local copy of the backend's game rules (see note below)
src/
├── MainMenu.jsx         # Landing screen: profile, create/join, settings
├── GameSetupModal.jsx   # New-match configuration
├── LobbyRoom.jsx        # Pre-game lobby: seats, ready-up, bots
├── MatchLoader.jsx       # Connects the boardgame.io client to the server
├── profileStore.js / settingsStore.js / matchSession.js   # Local persistence
├── bots/                # botEngine.js, botClient.js, BotManager.jsx, botNames.js
├── components/           # All in-match UI (board, hand, trading, chat, tutorial, etc.)
│   ├── BoardEditor.jsx     # Custom board editor (terrain/number editing, drag-to-swap, randomize)
│   └── PostGameStats.jsx   # End-of-game summary stats screen
├── constants/             # Avatars, player colors
├── hooks/
│   ├── usePlayerIdentities.js  # Resolves name/avatar/color per player
│   └── useViewportSize.js      # Tracks viewport size/orientation for the mobile layouts
└── __tests__/             # Vitest test suite
```

### ⚠️ Shared game logic

The `game/` folder at the project root is a **copy** of the backend's rules engine (`CatanGame.js`, `board.js`, `moves.js`, `players.js`, `setup.js`, `constants.js`, `phases.js`, plus `draft.js` and `flood.js` for the game modes), used to drive the boardgame.io client and to power the bot AI's move evaluation without extra server round trips. Because it's duplicated rather than shared as a package, **any rule change on the backend must be mirrored here** to keep the two in sync. The game modes are rule changes: until the backend's `game/` copy is updated, it will silently ignore `gameMode` and create a Classic match.

## 🧪 Testing

```bash
npm test
```

Covers the game modes (engine rules, a full bot-vs-bot game in every mode as a deadlock guard, and the draft over boardgame.io's `Local()` multiplayer transport), the economy (ledger invariants, rewards, persistence), the bot engine's decision logic, profile/settings/match-session persistence, board editor interactions, responsive/mobile layout behavior, post-game stats, i18n, and component render tests (e.g. `DiceRoller`).

## ⚙️ Installation & Running

```bash
git clone <repo link>
cd catan-frontend
npm install
npm run dev
```

The app runs on **`http://localhost:5173`** by default and expects the backend at `http://localhost:8000`. To point it elsewhere (e.g. a deployed backend), copy `.env.example` to `.env` and set:

```
VITE_SERVER_URL=https://your-backend-host
```

Other scripts: `npm run build` (production build), `npm run preview` (preview the build), `npm run lint` (ESLint).

## 🚀 Hosting

This frontend is hosted on **[Vercel](https://vercel.com/)**.

## 👤 Authors

Stefani Akimovska 237014, Anastasija Mishevska 237029, Viktor Trajkovski 237019