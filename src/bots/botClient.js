import { Client } from "boardgame.io/client";
import { SocketIO } from "boardgame.io/multiplayer";
import { CatanGame } from "../../game/CatanGame.js";
import { decideAction, DEFAULT_DIFFICULTY } from "./botEngine.js";

const TICK_MIN_MS = 800;
const TICK_JITTER_MS = 700;
const MAX_ACTIONS_PER_TURN = 20;
const MAX_TICKS_WAITING_ON_OWN_OFFER = 8;

// Harder bots think a little faster/more decisively; easier bots dawdle.
const DIFFICULTY_TICK_MULTIPLIER = { easy: 1.3, medium: 1, hard: 0.8 };

export function createBotClient({ server, matchID, playerID, credentials, difficulty = DEFAULT_DIFFICULTY }) {
  const seat = String(playerID);
  const speed = DIFFICULTY_TICK_MULTIPLIER[difficulty] || 1;

  const client = Client({
    game: CatanGame,
    matchID,
    playerID: seat,
    credentials,
    multiplayer: SocketIO({ server }),
  });

  client.start();

  let stopped = false;
  let busy = false;
  let turnKey = null;
  let actionsThisTurn = 0;
  let pendingOfferTicks = 0;

  const timer = setInterval(() => {
    if (stopped || busy) return;

    const state = client.getState();
    if (!state) return;
    const { G, ctx } = state;
    if (!G || !ctx) return;

    if (G.activeOffer && String(G.activeOffer.from) === seat) {
      pendingOfferTicks += 1;
      if (pendingOfferTicks > MAX_TICKS_WAITING_ON_OWN_OFFER) {
        busy = true;
        try {
          client.moves.cancelTrade();
        } finally {
          pendingOfferTicks = 0;
          setTimeout(() => {
            busy = false;
          }, 200);
        }
      }
      return;
    }
    pendingOfferTicks = 0;

    const stage = ctx.activePlayers ? ctx.activePlayers[seat] : undefined;
    const isCurrentPlayer = String(ctx.currentPlayer) === seat;
    if (!stage && !isCurrentPlayer) return;

    const key = `${ctx.phase}:${ctx.turn}:${ctx.currentPlayer}`;
    if (key !== turnKey) {
      turnKey = key;
      actionsThisTurn = 0;
    }

    if (actionsThisTurn >= MAX_ACTIONS_PER_TURN) {
      if (stage === "playing") client.moves.endTurn();
      return;
    }

    const decision = decideAction({ G, ctx, playerID: seat, stage, difficulty });
    if (!decision) return;

    busy = true;
    actionsThisTurn += 1;
    try {
      if (decision.move === "__endTurn__") {
        client.moves.endTurn();
      } else {
        client.moves[decision.move](...decision.args);
      }
    } finally {
      setTimeout(() => {
        busy = false;
      }, 200);
    }
  }, (TICK_MIN_MS + Math.random() * TICK_JITTER_MS) * speed);

  return {
    seat,
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      client.stop();
    },
  };
}