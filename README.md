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
- A victory screen once a player wins (`VictoryModal.jsx`)
- An in-app **Rules reference** (`RulesBook.jsx`) and an interactive **Tutorial** with its own mini demo board (`Tutorial.jsx`)

**Bots** — `bots/botEngine.js` is a heuristic AI that evaluates the current game state and picks moves (building, trading, robber placement, etc.); `bots/BotManager.jsx` spins up a `botClient.js` instance per bot seat and drives it automatically during a match.

**Profile, settings & session persistence** — `profileStore.js` and `settingsStore.js` persist the player's identity and app preferences (like the FPS overlay and animation toggle) locally; `matchSession.js` saves the current match ID, seat, and credentials so refreshing the page rejoins the match in progress instead of losing it.

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
├── constants/             # Avatars, player colors
├── hooks/usePlayerIdentities.js  # Resolves name/avatar/color per player
└── __tests__/             # Vitest test suite
```

### ⚠️ Shared game logic

The `game/` folder at the project root is a **copy** of the backend's rules engine (`CatanGame.js`, `board.js`, `moves.js`, `players.js`, `setup.js`, `constants.js`, `phases.js`), used to drive the boardgame.io client and to power the bot AI's move evaluation without extra server round trips. Because it's duplicated rather than shared as a package, **any rule change on the backend must be mirrored here** to keep the two in sync.

## 🧪 Testing

```bash
npm test
```

Covers the bot engine's decision logic, profile/settings/match-session persistence, and a component render test for `DiceRoller`.

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