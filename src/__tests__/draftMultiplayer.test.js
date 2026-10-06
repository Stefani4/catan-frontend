import { describe, it, expect } from "vitest";
import { Client } from "boardgame.io/client";
import { Local } from "boardgame.io/multiplayer";
import { makeGame } from "./helpers/engine.js";
import { bestDraftCard, getCurrentPack } from "../../game/draft.js";
import { DRAFT_CONFIG } from "../../game/constants.js";

// Real multiplayer reducer + playerView filtering (in-memory master).
describe("Draft over the (local) multiplayer transport", () => {
  it("each client only ever sees its own pack, picks sync, and the game moves on to setup", async () => {
    const game = makeGame({ gameMode: "draft" });
    const multiplayer = Local();
    const mk = (id) => { const c = Client({ game, numPlayers: 2, multiplayer, matchID: "t1", playerID: id }); c.start(); return c; };
    const c0 = mk("0"); const c1 = mk("1");
    const tick = () => new Promise((r) => setTimeout(r, 20));
    await tick();

    for (let round = 0; round < DRAFT_CONFIG.picksPerPlayer; round++) {
      for (const [pid, c] of [["0", c0], ["1", c1]]) {
        const { G } = c.getState();
        const visible = G.draft.packs.filter((p) => !p.hidden);
        expect(visible).toHaveLength(1);                        // hidden-information guarantee
        expect(G.draft.packs.filter((p) => p.hidden).every((p) => p.cards.length === 0)).toBe(true);
        const mine = getCurrentPack(G.draft, pid);
        expect(mine).toBe(visible[0]);
        c.moves.draftPick(bestDraftCard(mine).id);
        await tick();
      }
    }
    await tick();

    for (const c of [c0, c1]) {
      const s = c.getState();
      expect(s.ctx.phase).toBe("setup");
      expect(s.G.draft.complete).toBe(true);
    }
    const g0 = c0.getState().G;
    expect(g0.draft.picks["0"]).toHaveLength(DRAFT_CONFIG.picksPerPlayer);
    expect(g0.draft.picks["1"]).toHaveLength(DRAFT_CONFIG.picksPerPlayer);
    // both clients agree on the authoritative result
    expect(c1.getState().G.draft.claims).toEqual(g0.draft.claims);
  });
});
