import { describe, it, expect } from "vitest";
import { createBoard } from "../../game/board.js";
import {
  createFloodState, advanceFlood, coastalHexes, isIntersectionSubmerged, isEdgeSubmerged,
  roundsUntilTide, isTideGameOver, pickTideWinner,
} from "../../game/flood.js";
import { distributeResourcesLogic, moves } from "../../game/moves.js";
import { FLOOD_CONFIG } from "../../game/constants.js";

const noShuffle = (a) => [...a];
const emptyRes = () => ({ brick: 0, lumber: 0, grain: 0, wool: 0, ore: 0 });
const player = () => ({ resources: emptyRes(), settlements: [], cities: [], resorts: [], roads: [], victoryPoints: 0 });

function makeG(n = 2, mapType = "standard") {
  const board = createBoard(mapType);
  const G = {
    board, settings: { seasonsEnabled: false }, season: "Spring", turnCount: 0,
    players: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), player()])),
    bank: { brick: 19, lumber: 19, grain: 19, wool: 19, ore: 19 }, chatMessages: [],
  };
  G.flood = createFloodState(board, n, noShuffle);
  return G;
}
const jumpToRound = (G, n, round) => { G.turnCount = round * n; };

describe("telegraphing", () => {
  it("only ever targets coastal hexes and schedules at least one", () => {
    for (let i = 0; i < 20; i++) {
      const G = makeG(3);
      expect(G.flood.pending.length).toBeGreaterThan(0);
      const coast = new Set(coastalHexes(G.board.hexes).map((h) => h.id));
      G.flood.pending.forEach((id) => expect(coast.has(id)).toBe(true));
    }
  });
});

describe("schedule", () => {
  it("does nothing before the first tide round or mid-round", () => {
    const G = makeG(2);
    jumpToRound(G, 2, FLOOD_CONFIG.firstRound - 1);
    expect(advanceFlood(G, 2, noShuffle)).toEqual([]);
    G.turnCount = FLOOD_CONFIG.firstRound * 2 + 1; // mid-round
    expect(advanceFlood(G, 2, noShuffle)).toEqual([]);
  });

  it("floods exactly the telegraphed hexes on the tide round, then re-telegraphs", () => {
    const G = makeG(2);
    const doomed = [...G.flood.pending];
    jumpToRound(G, 2, FLOOD_CONFIG.firstRound);
    expect(roundsUntilTide(G, 2)).toBe(0);
    const sunk = advanceFlood(G, 2, noShuffle);
    expect(sunk).toEqual(doomed);
    doomed.forEach((id) => expect(G.board.hexes.find((h) => h.id === id).flooded).toBe(true));
    expect(G.flood.nextRound).toBe(FLOOD_CONFIG.firstRound + FLOOD_CONFIG.everyRounds);
    expect(G.flood.pending.every((id) => !doomed.includes(id))).toBe(true);
  });

  it("never floods below the minimum, marks the final tide and ends the game after the grace period", () => {
    const G = makeG(2);
    let round = FLOOD_CONFIG.firstRound;
    for (let i = 0; i < 40 && !G.flood.final; i++, round += FLOOD_CONFIG.everyRounds) {
      jumpToRound(G, 2, round);
      advanceFlood(G, 2, noShuffle);
    }
    const dry = G.board.hexes.filter((h) => !h.flooded).length;
    expect(G.flood.final).toBe(true);
    expect(dry).toBeGreaterThanOrEqual(G.flood.minLand);
    expect(G.flood.endsAtTurnCount).toBe(G.turnCount + 2 * FLOOD_CONFIG.finalGraceRounds);
    expect(isTideGameOver(G)).toBe(false);
    G.turnCount = G.flood.endsAtTurnCount;
    expect(isTideGameOver(G)).toBe(true);
  });
});

describe("effects", () => {
  it("flooded hexes stop producing", () => {
    const G = makeG(2);
    const hex = G.board.hexes.find((h) => h.number === 6);
    const vid = Object.keys(G.board.intersections).find((id) => G.board.intersections[id].adjacentHexes.includes(hex.id));
    G.players["0"].settlements.push({ id: vid, adjacentHexes: G.board.intersections[vid].adjacentHexes });
    distributeResourcesLogic({ G, roll: 6, random: { Shuffle: noShuffle } });
    const before = Object.values(G.players["0"].resources).reduce((a, b) => a + b, 0);
    expect(before).toBeGreaterThan(0);
    G.players["0"].resources = emptyRes();
    hex.flooded = true;
    distributeResourcesLogic({ G, roll: 6, random: { Shuffle: noShuffle } });
    expect(G.players["0"].resources[hex.resource]).toBe(0);
  });

  it("vertices and edges touching only flooded hexes are submerged; mixed ones are not", () => {
    const G = makeG(2);
    const v = Object.values(G.board.intersections).find((i) => i.adjacentHexes.length === 1);
    expect(isIntersectionSubmerged(G, v.id)).toBe(false);
    G.board.hexes.find((h) => h.id === v.adjacentHexes[0]).flooded = true;
    expect(isIntersectionSubmerged(G, v.id)).toBe(true);
    const mixed = Object.values(G.board.intersections).find((i) => i.adjacentHexes.length === 3 && i.adjacentHexes.includes(v.adjacentHexes[0]));
    if (mixed) expect(isIntersectionSubmerged(G, mixed.id)).toBe(false);
    const edge = Object.values(G.board.edges).find((e) => e.endpoints.every((x) => G.board.intersections[x].adjacentHexes.length === 1 && G.board.intersections[x].adjacentHexes[0] === v.adjacentHexes[0]));
    if (edge) expect(isEdgeSubmerged(G, edge.id)).toBe(true);
  });

  it("settlements can't be built on submerged vertices", () => {
    const G = makeG(2);
    const v = Object.values(G.board.intersections).find((i) => i.adjacentHexes.length === 1);
    G.board.hexes.find((h) => h.id === v.adjacentHexes[0]).flooded = true;
    G.players["0"].resources = { brick: 5, lumber: 5, grain: 5, wool: 5, ore: 5 };
    const ctx = { phase: "setup", currentPlayer: "0" };
    expect(moves.buildSettlement({ G, ctx }, v.id)).toBe("INVALID_MOVE");
  });

  it("the robber can't be placed on a flooded hex and is washed away if its hex floods", () => {
    const G = makeG(2);
    const target = G.flood.pending[0];
    G.board.hexes.find((h) => h.id === target).flooded = true;
    expect(moves.placeRobber({ G, ctx: { currentPlayer: "0" }, events: {}, random: {} }, target)).toBe("INVALID_MOVE");

    const G2 = makeG(2);
    G2.board.robberPosition = G2.flood.pending[0];
    jumpToRound(G2, 2, FLOOD_CONFIG.firstRound);
    advanceFlood(G2, 2, noShuffle);
    expect(G2.board.robberPosition).toBe("neutral");
  });
});

describe("tide winner", () => {
  it("VP leader wins; ties go to cities then settlements then lowest seat", () => {
    const G = makeG(3);
    G.players["0"].victoryPoints = 5; G.players["1"].victoryPoints = 7; G.players["2"].victoryPoints = 7;
    G.players["2"].cities = [{ id: "x" }];
    expect(pickTideWinner(G)).toBe("2");
    G.players["2"].cities = [];
    expect(pickTideWinner(G)).toBe("1");
  });
});
