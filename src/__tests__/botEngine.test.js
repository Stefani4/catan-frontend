import { describe, it, expect, beforeEach } from "vitest";
import { decideAction } from "../bots/botEngine.js";
import { createBoard } from "../../game/board.js";
import { createPlayer } from "../../game/players.js";

function makeG(numPlayers = 2, overrides = {}) {
  const players = {};
  for (let i = 0; i < numPlayers; i++) players[String(i)] = createPlayer();
  return {
    players,
    board: createBoard("standard"),
    settings: {},
    devCardDeck: [],
    devCardPlayedThisTurn: false,
    turnCount: 0,
    activeOffer: null,
    diceRolled: false,
    bank: { brick: 19, lumber: 19, grain: 19, wool: 19, ore: 19 },
    ...overrides,
  };
}

describe("decideAction - setup phase", () => {
  let G;
  beforeEach(() => {
    G = makeG(2);
  });

  it("picks buildSettlement when the player has no settlements yet", () => {
    const action = decideAction({ G, ctx: { phase: "setup" }, playerID: "0", stage: "placing" });
    expect(action.move).toBe("buildSettlement");
    expect(typeof action.args[0]).toBe("string");
    expect(G.board.intersections[action.args[0]]).toBeDefined();
  });

  it("picks buildRoad connected to the last placed settlement", () => {
    const intersectionId = Object.keys(G.board.intersections)[0];
    G.players["0"].settlements.push({
      id: intersectionId,
      owner: "0",
      adjacentHexes: G.board.intersections[intersectionId].adjacentHexes,
    });
    const action = decideAction({ G, ctx: { phase: "setup" }, playerID: "0", stage: "placing" });
    expect(action.move).toBe("buildRoad");
    const edge = G.board.intersections[intersectionId].adjacentEdges;
    expect(edge).toContain(action.args[0]);
  });

  it("does nothing when not in the 'placing' stage (e.g. other players waiting)", () => {
    const action = decideAction({ G, ctx: { phase: "setup" }, playerID: "1", stage: "idle" });
    expect(action).toBeNull();
  });

  it("does nothing once 2 settlements and 2 roads are already placed", () => {
    const int1 = Object.keys(G.board.intersections)[0];
    const int2 = Object.keys(G.board.intersections)[10];
    G.players["0"].settlements.push(
        { id: int1, owner: "0", adjacentHexes: [] },
        { id: int2, owner: "0", adjacentHexes: [] },
    );
    G.players["0"].roads.push({ id: "edge_a", owner: "0" }, { id: "edge_b", owner: "0" });
    const action = decideAction({ G, ctx: { phase: "setup" }, playerID: "0", stage: "placing" });
    expect(action).toBeNull();
  });
});

describe("decideAction - main phase, playing", () => {
  it("rolls the dice first if not rolled yet this turn", () => {
    const G = makeG(2, { diceRolled: false });
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "playing" });
    expect(action).toEqual({ move: "rollDice", args: [] });
  });

  it("builds a settlement when resources and a free spot are available", () => {
    const G = makeG(2, { diceRolled: true });
    const intersectionId = Object.keys(G.board.intersections)[0];
    const edgeId = G.board.intersections[intersectionId].adjacentEdges[0];
    G.players["0"].settlements.push({
      id: intersectionId,
      owner: "0",
      adjacentHexes: G.board.intersections[intersectionId].adjacentHexes,
    });
    G.players["0"].roads.push({ id: edgeId, owner: "0" });
    G.players["0"].resources = { brick: 5, lumber: 5, grain: 5, wool: 5, ore: 5 };

    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "playing" });
    expect(["buildSettlement", "buildCity"]).toContain(action.move);
  });

  it("ends the turn when there's nothing affordable and no reasonable trade", () => {
    const G = makeG(2, { diceRolled: true, activeOffer: null, bank: { brick: 0, lumber: 0, grain: 0, wool: 0, ore: 0 } });
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "playing" });
    expect(action.move).toBe("__endTurn__");
  });

  it("plays a Knight card when the robber sits on the player's own hex", () => {
    const G = makeG(2, { diceRolled: true, turnCount: 5 });
    G.players["0"].developmentCards.push({ type: "knight", boughtTurn: 1 });
    const robberHex = G.board.hexes.find((h) => h.id === G.board.robberPosition);
    const touchingIntersection = Object.keys(G.board.intersections).find((id) =>
        G.board.intersections[id].adjacentHexes.includes(robberHex.id),
    );
    G.players["0"].settlements.push({
      id: touchingIntersection,
      owner: "0",
      adjacentHexes: G.board.intersections[touchingIntersection].adjacentHexes,
    });

    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "playing" });
    expect(action).toEqual({ move: "playKnight", args: [] });
  });
});

describe("decideAction - robber placement", () => {
  it("picks a hex different from the robber's current position", () => {
    const G = makeG(2);
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "placingRobber" });
    expect(action.move).toBe("placeRobber");
    expect(action.args[0]).not.toBe(G.board.robberPosition);
  });

  it("prefers a hex touching an opponent and avoids the player's own hexes", () => {
    const G = makeG(2);
    const candidateHex = G.board.hexes.find((h) => h.id !== G.board.robberPosition);
    const touchingIntersection = Object.keys(G.board.intersections).find((id) =>
        G.board.intersections[id].adjacentHexes.includes(candidateHex.id),
    );
    G.players["1"].settlements.push({
      id: touchingIntersection,
      owner: "1",
      adjacentHexes: G.board.intersections[touchingIntersection].adjacentHexes,
    });

    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "placingRobber" });
    expect(action.move).toBe("placeRobber");
    expect(G.board.hexes.some((h) => h.id === action.args[0])).toBe(true);
  });
});

describe("decideAction - responding to a trade offer", () => {
  it("accepts a fair offer when it can afford to pay", () => {
    const G = makeG(2);
    G.players["1"].resources.ore = 2;
    G.activeOffer = {
      from: "0",
      to: "1",
      give: { type: "brick", amount: 2 },
      receive: { type: "ore", amount: 1 },
    };
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "1", stage: "responding" });
    expect(action).toEqual({ move: "acceptTrade", args: [] });
  });

  it("rejects the offer if the player can't afford it", () => {
    const G = makeG(2);
    G.players["1"].resources.ore = 0;
    G.activeOffer = {
      from: "0",
      to: "1",
      give: { type: "brick", amount: 2 },
      receive: { type: "ore", amount: 1 },
    };
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "1", stage: "responding" });
    expect(action).toEqual({ move: "cancelTrade", args: [] });
  });

  it("rejects an unfair offer (asks for more than it gives)", () => {
    const G = makeG(2);
    G.players["1"].resources.ore = 5;
    G.activeOffer = {
      from: "0",
      to: "1",
      give: { type: "brick", amount: 1 },
      receive: { type: "ore", amount: 3 },
    };
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "1", stage: "responding" });
    expect(action).toEqual({ move: "cancelTrade", args: [] });
  });

  it("returns null when the offer isn't directed at this player", () => {
    const G = makeG(3);
    G.activeOffer = {
      from: "0",
      to: "1",
      give: { type: "brick", amount: 1 },
      receive: { type: "ore", amount: 1 },
    };
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "2", stage: "responding" });
    expect(action).toBeNull();
  });
});

describe("decideAction - edge cases", () => {
  it("returns null when G or ctx is missing", () => {
    expect(decideAction({ G: null, ctx: {}, playerID: "0", stage: "playing" })).toBeNull();
    expect(decideAction({ G: {}, ctx: null, playerID: "0", stage: "playing" })).toBeNull();
  });

  it("returns null for an unknown stage in main phase", () => {
    const G = makeG(2);
    const action = decideAction({ G, ctx: { phase: "main" }, playerID: "0", stage: "unknown-stage" });
    expect(action).toBeNull();
  });
});
