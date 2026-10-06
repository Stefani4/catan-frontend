import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import VictoryModal from "../components/VictoryModal.jsx";
import { encodePlayerIdentity } from "../profileStore.js";
import { loadWallet } from "../economy/walletStore.js";
import { setup } from "../../game/setup.js";

function mockServer(players) {
  vi.stubGlobal("fetch", vi.fn((url) => {
    if (String(url).endsWith("/rematch")) return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ players }) });
  }));
}
const human = (id, name) => ({ id, name: encodePlayerIdentity({ name, colorIndex: id, avatarId: "anchor", pieceSkinId: null, frameId: null }) });
const bot = (id) => ({ id, name: encodePlayerIdentity({ name: "Bot", isBot: true }) });

function renderOver({ winner, matchID, mode = "classic" }) {
  const G = setup({ ctx: { numPlayers: 2 } }, { gameMode: mode });
  const ctx = { phase: "main", currentPlayer: "0", numPlayers: 2, gameover: { winner } };
  return render(<VictoryModal G={G} ctx={ctx} playerID="0" matchID={matchID} bots={[]} onStartRematch={() => {}} onLeave={() => {}} />);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("match rewards on the victory screen", () => {
  it("pays the winner once, shows a receipt, and a remount (refresh) does not pay again", async () => {
    mockServer([human(0, "Me"), human(1, "Friend")]);
    const first = renderOver({ winner: "0", matchID: "m-win" });
    await waitFor(() => expect(screen.getByTestId("reward-receipt")).toBeInTheDocument());
    const afterFirst = loadWallet().balance;
    expect(afterFirst).toBeGreaterThan(100); // welcome bonus + payout + first-win achievement
    expect(screen.getByTestId("reward-total")).toHaveTextContent(`+${afterFirst - 100}`);
    first.unmount(); cleanup();

    renderOver({ winner: "0", matchID: "m-win" });
    await waitFor(() => expect(screen.getByTestId("reward-receipt")).toBeInTheDocument());
    expect(loadWallet().balance).toBe(afterFirst);
  });

  it("pays half against bots only", async () => {
    mockServer([human(0, "Me"), bot(1)]);
    renderOver({ winner: "1", matchID: "m-bots" });
    await waitFor(() => expect(screen.getByTestId("reward-receipt")).toBeInTheDocument());
    expect(loadWallet().balance - 100).toBe(Math.round(15 * 0.5)); // loser: participation only, halved
  });

  it("does not pay until every seat's identity is known", async () => {
    mockServer([human(0, "Me")]); // seat 1 not reported yet
    renderOver({ winner: "0", matchID: "m-wait" });
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByTestId("reward-receipt")).toBeNull();
    expect(loadWallet().balance).toBe(100);
  });

  it("shows the tide message when the tide ended the game", async () => {
    mockServer([human(0, "Me"), human(1, "Friend")]);
    const G = setup({ ctx: { numPlayers: 2 } }, { gameMode: "shrinking" });
    const ctx = { phase: "main", currentPlayer: "0", numPlayers: 2, gameover: { winner: "0", reason: "tide" } };
    render(<VictoryModal G={G} ctx={ctx} playerID="0" matchID="m-tide" bots={[]} onStartRematch={() => {}} onLeave={() => {}} />);
    expect(screen.getByTestId("tide-ended")).toBeInTheDocument();
  });
});

describe("translation keys", () => {
  const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const en = JSON.parse(fs.readFileSync(path.join(srcDir, "locales/en.json"), "utf8"));
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (["__tests__", "locales"].includes(e.name) ? [] : walk(path.join(d, e.name))) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []);

  it("every statically-used t('key') in the new UI exists", () => {
    const files = walk(srcDir).filter((f) => /(DraftPanel|Shop|GameHeader|Hex|VictoryModal|GameSetupModal|MainMenu)\.jsx$/.test(f));
    const missing = [];
    files.forEach((f) => {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/\bt\("([A-Za-z0-9_]+)"/g)) if (!(m[1] in en)) missing.push(`${path.basename(f)}: ${m[1]}`);
    });
    expect(missing).toEqual([]);
  });

  it("every dynamic key family resolves for every catalog item, bundle, achievement and mode", async () => {
    const { CATALOG, RARITIES } = await import("../economy/catalog.js");
    const { ACHIEVEMENTS } = await import("../economy/rewards.js");
    const { DRAFT_BUNDLES, GAME_MODE_IDS } = await import("../../game/constants.js");
    const keys = [
      ...CATALOG.map((i) => `shopItem_${i.id}`),
      ...Object.keys(RARITIES).map((r) => `rarity_${r}`),
      ...ACHIEVEMENTS.flatMap((a) => [`ach_${a.id}`, `ach_${a.id}_desc`]),
      ...DRAFT_BUNDLES.map((b) => `bundle_${b.id}`),
      ...GAME_MODE_IDS.flatMap((m) => [`modeName_${m}`, `modeDesc_${m}`]),
      "mapType_compact",
    ];
    expect(keys.filter((k) => !(k in en))).toEqual([]);
  });
});
