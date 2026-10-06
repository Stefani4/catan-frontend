import { describe, it, expect } from "vitest";
import { normalizeGameSettings, MAP_TYPES, DRAFT_CONFIG, FLOOD_CONFIG } from "../../game/constants.js";
import { createBoard } from "../../game/board.js";
import { CatanGame } from "../../game/CatanGame.js";
import { createClient, viewFor, act, playWithBots } from "./helpers/engine.js";

describe("normalizeGameSettings - modes", () => {
  it("defaults to classic with no forced values", () => {
    const s = normalizeGameSettings({});
    expect(s.gameMode).toBe("classic");
    expect(s.victoryPointsTarget).toBe(10);
    expect(s.turnTimerSeconds).toBeNull();
  });

  it("Blitz forces 6 VP, the compact board and a short timer, whatever the host asked for", () => {
    const s = normalizeGameSettings({ gameMode: "blitz", victoryPointsTarget: 20, mapType: "large" });
    expect(s.victoryPointsTarget).toBe(6);
    expect(s.mapType).toBe("compact");
    expect(s.turnTimerSeconds).toBe(30);
    expect(s.customBoard).toBeNull();
  });

  it("falls back to classic for an unknown mode", () => {
    expect(normalizeGameSettings({ gameMode: "hax" }).gameMode).toBe("classic");
  });

  it("keeps the player's own choices in modes that don't force them", () => {
    const s = normalizeGameSettings({ gameMode: "draft", victoryPointsTarget: 15, mapType: "large" });
    expect(s.victoryPointsTarget).toBe(15);
    expect(s.mapType).toBe("large");
  });
});

describe("compact board", () => {
  it("is smaller than standard and has a sane token spread (9-12 can occur)", () => {
    expect(MAP_TYPES.compact.hexCount).toBeLessThan(MAP_TYPES.standard.hexCount);
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      const b = createBoard("compact");
      expect(b.hexes).toHaveLength(12);
      expect(b.hexes.filter((h) => h.terrain === "desert")).toHaveLength(1);
      b.hexes.forEach((h) => h.number && seen.add(h.number));
    }
    [9, 10, 11, 12].forEach((n) => expect(seen.has(n)).toBe(true));
  });

  it("never dead-ends initial placement for 4 players", () => {
    for (let t = 0; t < 200; t++) {
      const b = createBoard("compact");
      const blocked = new Set();
      let placed = 0;
      for (const id of Object.keys(b.intersections).sort(() => Math.random() - 0.5)) {
        if (blocked.has(id)) continue;
        blocked.add(id);
        b.intersections[id].neighbors.forEach((n) => blocked.add(n));
        placed++;
      }
      expect(placed).toBeGreaterThanOrEqual(8);
    }
  });

  it("Blitz ends the game at 6 VP", () => {
    const G = { settings: { victoryPointsTarget: 6 }, players: { 0: { victoryPoints: 6 }, 1: { victoryPoints: 3 } } };
    expect(CatanGame.endIf({ G, ctx: { currentPlayer: "1" } })).toEqual({ winner: "0" });
    G.players[0].victoryPoints = 5;
    expect(CatanGame.endIf({ G, ctx: { currentPlayer: "1" } })).toBeUndefined();
  });
});

describe("classic regression", () => {
  it("still starts in setup with no mode state", () => {
    const c = createClient({ numPlayers: 2 });
    const s = c.getState();
    expect(s.ctx.phase).toBe("setup");
    expect(s.G.draft).toBeNull();
    expect(s.G.flood).toBeNull();
  });

  it("second settlement still pays out neighbouring hexes", () => {
    const c = createClient({ numPlayers: 2 });
    const order = ["0", "1", "1", "0"];
    for (const pid of order) {
      for (let k = 0; k < 2; k++) {
        const { G } = viewFor(c, pid);
        const me = G.players[pid];
        if (me.settlements.length === me.roads.length) {
          const free = Object.keys(G.board.intersections).find((id) => {
            const v = G.board.intersections[id];
            const taken = Object.values(G.players).some((p) => p.settlements.some((b) => b.id === id));
            const nearTaken = v.neighbors.some((n) => Object.values(G.players).some((p) => p.settlements.some((b) => b.id === n)));
            return !taken && !nearTaken;
          });
          act(c, pid, "buildSettlement", free);
        } else {
          const last = me.settlements[me.settlements.length - 1];
          act(c, pid, "buildRoad", G.board.intersections[last.id].adjacentEdges[0]);
        }
      }
    }
    const s = c.getState();
    expect(s.ctx.phase).toBe("main");
    const total = Object.values(s.G.players["0"].resources).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });
});

describe("bots finish a full game in every mode (deadlock guard)", () => {
  for (const mode of ["classic", "blitz", "draft", "shrinking"]) {
    it(`${mode}: 3 players`, () => {
      const c = createClient({ numPlayers: 3, setupData: { gameMode: mode } });
      const r = playWithBots(c, { maxSteps: 9000 });
      expect(r.stalled).toBe(false);
      expect(r.timedOut).toBeUndefined();
      expect(r.gameover?.winner).toBeDefined();
      if (mode === "blitz") {
        expect(r.state.G.players[r.gameover.winner].victoryPoints).toBeGreaterThanOrEqual(6);
      }
    }, 120000);
  }
});

it("config sanity", () => {
  expect(DRAFT_CONFIG.packSize).toBeGreaterThan(DRAFT_CONFIG.picksPerPlayer);
  expect(FLOOD_CONFIG.minLandRatio).toBeLessThan(1);
});
