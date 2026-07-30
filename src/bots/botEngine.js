import {
  isDistanceRuleMet,
  isIntersectionConnectedToPlayerRoad,
  getBestBankRatio,
} from "../../game/moves.js";
import { DEV_CARD_COST } from "../../game/constants.js";

const PIP_VALUE = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

const COSTS = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, grain: 1, wool: 1 },
  city: { grain: 2, ore: 3 },
};

function canAfford(resources, cost) {
  return Object.entries(cost).every(([res, amt]) => (resources[res] || 0) >= amt);
}

function hexById(G, id) {
  return G.board.hexes.find((h) => h.id === id);
}

function allBuildings(player) {
  return [...player.settlements, ...player.cities, ...(player.resorts || [])];
}

function isIntersectionOccupied(G, intersectionId) {
  return Object.values(G.players).some((p) =>
      allBuildings(p).some((b) => b.id === intersectionId),
  );
}

function intersectionProductionScore(G, intersectionId) {
  const intersection = G.board.intersections[intersectionId];
  if (!intersection) return -Infinity;
  const seenResources = new Set();
  let score = 0;
  (intersection.adjacentHexes || []).forEach((hexId) => {
    const hex = hexById(G, hexId);
    if (!hex || hex.terrain === "desert" || hex.number == null) return;
    score += PIP_VALUE[hex.number] || 0;
    if (hex.resource) seenResources.add(hex.resource);
  });
  score += seenResources.size * 0.75;
  if (intersection.harbor) {
    score += intersection.harbor.type === "generic" ? 0.5 : 1.25;
  }
  return score;
}

function bestOpenIntersection(G, playerID, { requireRoadConnection }) {
  let best = null;
  let bestScore = -Infinity;
  Object.keys(G.board.intersections).forEach((id) => {
    if (isIntersectionOccupied(G, id)) return;
    if (!isDistanceRuleMet(G, id)) return;
    if (requireRoadConnection && !isIntersectionConnectedToPlayerRoad(G, playerID, id)) {
      return;
    }
    const score = intersectionProductionScore(G, id);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });
  return best;
}

function bestSettlementToUpgrade(G, playerID) {
  const player = G.players[playerID];
  if (!player.settlements.length) return null;
  let best = null;
  let bestScore = -Infinity;
  player.settlements.forEach((s) => {
    const score = intersectionProductionScore(G, s.id);
    if (score > bestScore) {
      bestScore = score;
      best = s.id;
    }
  });
  return best;
}

function bestSetupRoad(G, settlement) {
  const intersection = G.board.intersections[settlement.id];
  if (!intersection) return null;
  let best = null;
  let bestScore = -Infinity;
  (intersection.adjacentEdges || []).forEach((edgeId) => {
    const edge = G.board.edges[edgeId];
    if (!edge) return;
    const other = edge.endpoints.find((e) => e !== settlement.id);
    const score = other ? intersectionProductionScore(G, other) : 0;
    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  });
  return best;
}

function isEdgeFree(G, edgeId) {
  return !Object.values(G.players).some((p) => p.roads.some((r) => r.id === edgeId));
}

function edgesConnectedToPlayer(G, playerID) {
  const player = G.players[playerID];
  const connected = new Set();

  allBuildings(player).forEach((b) => {
    const it = G.board.intersections[b.id];
    (it?.adjacentEdges || []).forEach((e) => connected.add(e));
  });

  player.roads.forEach((r) => {
    const edge = G.board.edges[r.id];
    (edge?.neighbors || []).forEach((e) => connected.add(e));
  });

  return connected;
}

function bestExpansionRoad(G, playerID) {
  const player = G.players[playerID];
  const owned = new Set(allBuildings(player).map((b) => b.id));
  const candidates = [...edgesConnectedToPlayer(G, playerID)].filter((id) =>
      isEdgeFree(G, id),
  );

  let best = null;
  let bestScore = -Infinity;
  candidates.forEach((edgeId) => {
    const edge = G.board.edges[edgeId];
    if (!edge) return;
    edge.endpoints.forEach((intId) => {
      if (owned.has(intId)) return;
      if (isIntersectionOccupied(G, intId)) return;
      if (!isDistanceRuleMet(G, intId)) return;
      const score = intersectionProductionScore(G, intId);
      if (score > bestScore) {
        bestScore = score;
        best = edgeId;
      }
    });
  });

  if (best) return best;
  return candidates[0] || null;
}

function hasPlayableCard(player, type, turnCount) {
  return player.developmentCards.some(
      (c) => c.type === type && c.boughtTurn !== turnCount,
  );
}

function playerTouchesHex(G, playerID, hexId) {
  return allBuildings(G.players[playerID]).some((b) =>
      (b.adjacentHexes || []).includes(hexId),
  );
}

function currentGoal(G, playerID) {
  if (bestSettlementToUpgrade(G, playerID)) {
    return { type: "city", cost: COSTS.city };
  }
  if (bestOpenIntersection(G, playerID, { requireRoadConnection: true })) {
    return { type: "settlement", cost: COSTS.settlement };
  }
  return null;
}

function missingResource(player, cost) {
  let worst = null;
  let worstDeficit = 0;
  Object.keys(cost).forEach((r) => {
    const deficit = (cost[r] || 0) - (player.resources[r] || 0);
    if (deficit > worstDeficit) {
      worstDeficit = deficit;
      worst = r;
    }
  });
  return worst;
}

function surplusResource(player, cost) {
  const ALL = ["brick", "lumber", "grain", "wool", "ore"];
  let best = null;
  let bestSpare = 0;
  ALL.forEach((r) => {
    const spare = (player.resources[r] || 0) - (cost[r] || 0);
    if (spare > bestSpare) {
      bestSpare = spare;
      best = r;
    }
  });
  return best;
}

function decidePlayerTradeOffer(G, playerID) {
  if (G.activeOffer) return null;
  if (Math.random() > 0.45) return null;

  const goal = currentGoal(G, playerID);
  if (!goal) return null;

  const player = G.players[playerID];
  const needType = missingResource(player, goal.cost);
  if (!needType) return null;

  const giveType = surplusResource(player, goal.cost);
  if (!giveType || giveType === needType) return null;

  const others = Object.keys(G.players).filter((pid) => pid !== playerID);
  let target = null;
  let bestHave = 0;
  others.forEach((pid) => {
    const have = G.players[pid].resources[needType] || 0;
    if (have > bestHave) {
      bestHave = have;
      target = pid;
    }
  });
  if (!target) return null;

  return {
    move: "offerTrade",
    args: [
      {
        targetPlayerId: target,
        give: { type: giveType, amount: 1 },
        receive: { type: needType, amount: 1 },
      },
    ],
  };
}

function decideRobberPlacement(G, playerID) {
  const candidates = G.board.hexes.filter(
      (h) => h.id !== G.board.robberPosition,
  );
  let best = null;
  let bestScore = -Infinity;
  candidates.forEach((hex) => {
    let value = 0;
    let touchesOwn = false;
    Object.entries(G.players).forEach(([pid, p]) => {
      allBuildings(p).forEach((b) => {
        if (!(b.adjacentHexes || []).includes(hex.id)) return;
        if (pid === playerID) {
          touchesOwn = true;
        } else {
          const isUpgraded =
              p.cities.some((c) => c.id === b.id) ||
              (p.resorts || []).some((r) => r.id === b.id);
          value += isUpgraded ? 2 : 1;
        }
      });
    });
    if (touchesOwn) value -= 3;
    if (value > bestScore) {
      bestScore = value;
      best = hex.id;
    }
  });
  return best || (candidates[0] && candidates[0].id) || null;
}

function decideTradeResponse(G, playerID) {
  const offer = G.activeOffer;
  if (!offer || String(offer.to) !== String(playerID)) return null;
  const player = G.players[playerID];
  const canPay = (player.resources[offer.receive.type] || 0) >= offer.receive.amount;
  const looksFair = offer.give.amount >= offer.receive.amount;
  if (canPay && looksFair) return { move: "acceptTrade", args: [] };
  return { move: "cancelTrade", args: [] };
}

function decideBankTrade(G, playerID) {
  if (G.activeOffer && String(G.activeOffer.from) === String(playerID)) {
    return null;
  }

  const player = G.players[playerID];
  const resources = player.resources;

  const goal = currentGoal(G, playerID);
  if (goal) {
    const needType = missingResource(player, goal.cost);
    if (needType) {
      const giveType = surplusResource(player, goal.cost);
      if (giveType && giveType !== needType && (G.bank?.[needType] || 0) > 0) {
        const ratio = getBestBankRatio(G, playerID, giveType);
        if ((resources[giveType] || 0) >= ratio) {
          return { move: "tradeWithBank", args: [{ give: giveType, receive: needType }] };
        }
      }
    }
  }

  const entries = Object.entries(resources).sort((a, b) => b[1] - a[1]);
  const [mostRes, mostAmt] = entries[0] || [];
  if (!mostRes || !mostAmt) return null;

  const ratio = getBestBankRatio(G, playerID, mostRes);
  if (mostAmt < ratio) return null;

  const wanted = ["brick", "lumber", "grain", "wool", "ore"]
      .filter((r) => r !== mostRes && (G.bank?.[r] || 0) > 0)
      .sort((a, b) => (resources[a] || 0) - (resources[b] || 0))[0];

  if (!wanted || wanted === mostRes) return null;
  return { move: "tradeWithBank", args: [{ give: mostRes, receive: wanted }] };
}

function decideSetupAction(G, playerID) {
  const player = G.players[playerID];
  if (player.settlements.length === player.roads.length) {
    if (player.settlements.length >= 2) return null;
    const spot = bestOpenIntersection(G, playerID, { requireRoadConnection: false });
    return spot ? { move: "buildSettlement", args: [spot] } : null;
  }
  const lastSettlement = player.settlements[player.settlements.length - 1];
  if (!lastSettlement) return null;
  const edge = bestSetupRoad(G, lastSettlement);
  return edge ? { move: "buildRoad", args: [edge] } : null;
}

function decidePlayingAction(G, ctx, playerID) {
  if (!G.diceRolled) return { move: "rollDice", args: [] };
  if (G.activeOffer && String(G.activeOffer.from) === String(playerID)) {
    return null;
  }

  const player = G.players[playerID];

  if (!G.devCardPlayedThisTurn && hasPlayableCard(player, "knight", G.turnCount)) {
    if (playerTouchesHex(G, playerID, G.board.robberPosition)) {
      return { move: "playKnight", args: [] };
    }
  }

  if (canAfford(player.resources, COSTS.city)) {
    const target = bestSettlementToUpgrade(G, playerID);
    if (target) return { move: "buildCity", args: [target] };
  }

  const reachableSpot = bestOpenIntersection(G, playerID, { requireRoadConnection: true });

  if (canAfford(player.resources, COSTS.settlement) && reachableSpot) {
    return { move: "buildSettlement", args: [reachableSpot] };
  }

  if (!reachableSpot && canAfford(player.resources, COSTS.road)) {
    const edge = bestExpansionRoad(G, playerID);
    if (edge) return { move: "buildRoad", args: [edge] };
  }

  if (
      canAfford(player.resources, DEV_CARD_COST) &&
      (G.devCardDeck?.length || 0) > 0 &&
      Math.random() < 0.6
  ) {
    return { move: "buyDevelopmentCard", args: [] };
  }

  const playerTrade = decidePlayerTradeOffer(G, playerID);
  if (playerTrade) return playerTrade;

  const trade = decideBankTrade(G, playerID);
  if (trade) return trade;

  return { move: "__endTurn__", args: [] };
}

export function decideAction({ G, ctx, playerID, stage }) {
  if (!G || !ctx) return null;

  if (ctx.phase === "setup") {
    if (stage !== "placing") return null;
    return decideSetupAction(G, playerID);
  }

  if (ctx.phase === "main") {
    if (stage === "responding") return decideTradeResponse(G, playerID);
    if (stage === "placingRobber") {
      const hexId = decideRobberPlacement(G, playerID);
      return hexId ? { move: "placeRobber", args: [hexId] } : null;
    }
    if (stage === "playing") return decidePlayingAction(G, ctx, playerID);
  }

  return null;
}
