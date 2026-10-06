import { describe, it, expect } from "vitest";
import { createBoard } from "../../game/board.js";
import { createDraft, getCurrentPack, getPackIndex, applyDraftPick, maskDraftForPlayer, bestDraftCard } from "../../game/draft.js";
import { distributeResourcesLogic } from "../../game/moves.js";
import { DRAFT_CONFIG } from "../../game/constants.js";
import { createClient, viewFor, act } from "./helpers/engine.js";

const IDS = ["0", "1", "2", "3"];

describe("pack generation", () => {
  it("deals one full pack per player with unique hex cards and exactly one rare", () => {
    const d = createDraft(createBoard("standard"), IDS);
    expect(d.packs).toHaveLength(4);
    const hexIds = d.packs.flatMap((p) => p.cards.filter((c) => c.kind === "hex").map((c) => c.hexId));
    expect(new Set(hexIds).size).toBe(hexIds.length);
    d.packs.forEach((p) => {
      expect(p.cards).toHaveLength(DRAFT_CONFIG.packSize);
      expect(p.cards.filter((c) => c.rarity === "rare")).toHaveLength(1);
    });
  });

  it("never offers the desert and caps hex cards on tiny boards", () => {
    const board = createBoard("compact");
    const d = createDraft(board, IDS);
    const desert = board.hexes.find((h) => h.terrain === "desert").id;
    const hexIds = d.packs.flatMap((p) => p.cards.filter((c) => c.kind === "hex").map((c) => c.hexId));
    expect(hexIds).not.toContain(desert);
    expect(hexIds.length).toBeLessThanOrEqual(11);
  });
});

describe("passing", () => {
  it("rotates packs one seat per round", () => {
    const d = createDraft(createBoard("standard"), IDS);
    expect(getPackIndex(d, "0")).toBe(0);
    IDS.forEach((p) => applyDraftPick(d, p, getCurrentPack(d, p).cards[0].id));
    expect(d.round).toBe(1);
    expect(getPackIndex(d, "0")).toBe(1);
    expect(getPackIndex(d, "3")).toBe(0);
  });

  it("rejects double picks, foreign cards and picks from another pack", () => {
    const d = createDraft(createBoard("standard"), IDS);
    const mine = getCurrentPack(d, "0").cards[0].id;
    const theirs = getCurrentPack(d, "1").cards[0].id;
    expect(applyDraftPick(d, "0", theirs)).toBe("card_not_in_pack");
    expect(applyDraftPick(d, "0", mine)).toBeNull();
    expect(applyDraftPick(d, "0", getCurrentPack(d, "0").cards[0]?.id)).toBe("already_picked");
    expect(applyDraftPick(d, "9", mine)).toBe("not_a_drafter");
  });

  it("completes after the configured number of rounds and every player drafted the same count", () => {
    const d = createDraft(createBoard("standard"), ["0", "1"]);
    while (!d.complete) ["0", "1"].forEach((p) => applyDraftPick(d, p, bestDraftCard(getCurrentPack(d, p)).id));
    expect(d.round).toBe(DRAFT_CONFIG.picksPerPlayer);
    expect(d.picks["0"]).toHaveLength(DRAFT_CONFIG.picksPerPlayer);
    expect(d.picks["1"]).toHaveLength(DRAFT_CONFIG.picksPerPlayer);
    Object.entries(d.claims).forEach(([hexId, pid]) => expect(d.picks[pid].some((c) => c.hexId === hexId)).toBe(true));
  });

  it("masks every pack except the viewer's current one", () => {
    const d = createDraft(createBoard("standard"), IDS);
    const v = maskDraftForPlayer(d, "2");
    expect(v.packs.filter((p) => !p.hidden)).toHaveLength(1);
    expect(v.packs[2].cards.length).toBe(DRAFT_CONFIG.packSize);
    expect(v.packs[0].cards).toHaveLength(0);
  });
});

describe("in the engine", () => {
  it("runs the draft, then setup, and pays the drafted bundles from the bank (no 2nd-settlement grant)", () => {
    const c = createClient({ numPlayers: 2, setupData: { gameMode: "draft" } });
    expect(c.getState().ctx.phase).toBe("draft");

    // server-side truth, to compute the expected payout
    const expected = { 0: {}, 1: {} };
    for (let r = 0; r < DRAFT_CONFIG.picksPerPlayer; r++) {
      ["1", "0"].forEach((pid) => {
        const { G } = viewFor(c, pid);
        const pack = G.draft.packs.find((p) => !p.hidden);
        const card = bestDraftCard(pack);
        if (card.kind === "resources") {
          Object.entries(card.resources).forEach(([k, v]) => (expected[pid][k] = (expected[pid][k] || 0) + v));
        }
        act(c, pid, "draftPick", card.id);
      });
    }
    const s = c.getState();
    expect(s.ctx.phase).toBe("setup");
    ["0", "1"].forEach((pid) => {
      Object.keys(s.G.players[pid].resources).forEach((res) =>
          expect(s.G.players[pid].resources[res]).toBe(expected[pid][res] || 0));
    });
    const total = Object.values(s.G.bank).reduce((a, b) => a + b, 0);
    const held = ["0", "1"].flatMap((p) => Object.values(s.G.players[p].resources)).reduce((a, b) => a + b, 0);
    expect(total + held).toBe(95);
  });

  it("an invalid pick leaves the draft untouched", () => {
    const c = createClient({ numPlayers: 2, setupData: { gameMode: "draft" } });
    act(c, "0", "draftPick", "nope");
    expect(c.getState().G.draft.picks["0"]).toHaveLength(0);
  });
});

describe("claimed hex bonus", () => {
  function craft() {
    const board = createBoard("standard");
    const hex = board.hexes.find((h) => h.number === 8);
    const players = { 0: { resources: { brick: 0, lumber: 0, grain: 0, wool: 0, ore: 0 }, settlements: [], cities: [], resorts: [] },
                      1: { resources: { brick: 0, lumber: 0, grain: 0, wool: 0, ore: 0 }, settlements: [], cities: [], resorts: [] } };
    const G = { board, players, settings: { seasonsEnabled: false }, season: "Spring", draft: { claims: { [hex.id]: "1" } },
                bank: { brick: 19, lumber: 19, grain: 19, wool: 19, ore: 19 } };
    return { G, hex };
  }
  it("pays the owner +1 on the hex's number even with no building on it", () => {
    const { G, hex } = craft();
    distributeResourcesLogic({ G, roll: 8, random: { Shuffle: (a) => a } });
    expect(G.players["1"].resources[hex.resource]).toBe(DRAFT_CONFIG.hexClaimBonus);
    expect(G.players["0"].resources[hex.resource]).toBe(0);
  });
  it("is blocked by the robber", () => {
    const { G, hex } = craft();
    G.board.robberPosition = hex.id;
    distributeResourcesLogic({ G, roll: 8, random: { Shuffle: (a) => a } });
    expect(G.players["1"].resources[hex.resource]).toBe(0);
  });
});
