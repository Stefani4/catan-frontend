import { Client } from "boardgame.io/client";
import { CatanGame } from "../../../../../../Downloads/catan-changed-files/catan/catan-frontend/game/CatanGame.js";
import { decideAction } from "../../../../../../Downloads/catan-changed-files/catan/catan-frontend/src/bots/botEngine.js";

/**
 * boardgame.io's local Client doesn't forward `setupData`, so wrap `setup` in a
 * closure — this is exactly what the server does when a match is created.
 */
export function makeGame(setupData = {}, tweakG) {
  return {
    ...CatanGame,
    setup: (ctx) => {
      const G = CatanGame.setup(ctx, setupData);
      if (tweakG) tweakG(G, ctx);
      return G;
    },
  };
}

export function createClient({ numPlayers = 2, setupData = {}, tweakG } = {}) {
  const client = Client({ game: makeGame(setupData, tweakG), numPlayers });
  client.start();
  return client;
}

export function viewFor(client, pid) {
  client.updatePlayerID(String(pid));
  return client.getState();
}

export function act(client, pid, move, ...args) {
  client.updatePlayerID(String(pid));
  client.moves[move](...args);
  return client.getState();
}

/** Everyone who is allowed to act right now (stage players, or the current player). */
export function actors(state) {
  const { ctx } = state;
  if (ctx.activePlayers) return Object.keys(ctx.activePlayers);
  return [String(ctx.currentPlayer)];
}

/**
 * Lets the heuristic bots play until the game ends. Returns
 * { gameover, steps, stalled }. A game is "stalled" if nobody can produce a
 * decision for many consecutive iterations — i.e. a deadlock bug.
 */
export function playWithBots(client, { maxSteps = 6000, difficulty = "medium", onStep } = {}) {
  let steps = 0;
  let idle = 0;
  let actionsThisTurn = 0;
  let lastTurnKey = "";

  while (steps < maxSteps) {
    const base = client.getState();
    if (base.ctx.gameover) return { gameover: base.ctx.gameover, steps, stalled: false, state: base };

    const key = `${base.ctx.phase}:${base.ctx.turn}:${base.ctx.currentPlayer}`;
    if (key !== lastTurnKey) {
      lastTurnKey = key;
      actionsThisTurn = 0;
    }

    let acted = false;
    for (const pid of actors(base)) {
      const state = viewFor(client, pid);
      const stage = state.ctx.activePlayers ? state.ctx.activePlayers[pid] : undefined;

      let decision;
      if (actionsThisTurn >= 20 && stage === "playing") {
        decision = { move: "__endTurn__", args: [] };
      } else {
        decision = decideAction({ G: state.G, ctx: state.ctx, playerID: pid, stage, difficulty });
      }
      if (!decision) continue;

      actionsThisTurn += 1;
      if (decision.move === "__endTurn__") client.moves.endTurn();
      else client.moves[decision.move](...decision.args);
      acted = true;
      steps += 1;
      if (onStep) onStep(client.getState(), pid, decision);
      break;
    }

    idle = acted ? 0 : idle + 1;
    if (idle > 25) {
      return { gameover: null, steps, stalled: true, state: client.getState() };
    }
  }
  return { gameover: client.getState().ctx.gameover || null, steps, stalled: false, timedOut: true, state: client.getState() };
}
