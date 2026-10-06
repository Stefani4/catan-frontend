import {
  isDistanceRuleMet,
  isIntersectionConnectedToPlayerRoad,
  getBestBankRatio,
} from "../../game/moves.js";
import { DEV_CARD_COST } from "../../game/constants.js";
import { bestDraftCard, getCurrentPack, hasPickedThisRound } from "../../game/draft.js";
import { isEdgeSubmerged, isIntersectionSubmerged } from "../../game/flood.js";

const PIP_VALUE = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

export const DIFFICULTIES = ["easy", "medium", "hard"];
export const DEFAULT_DIFFICULTY = "medium";

function normalizeDifficulty(difficulty) {
  return DIFFICULTIES.includes(difficulty) ? difficulty : DEFAULT_DIFFICULTY;
}

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

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
  const doomed = new Set(G.flood?.pending || []);
  (intersection.adjacentHexes || []).forEach((hexId) => {
    const hex = hexById(G, hexId);
    if (!hex || hex.terrain === "desert" || hex.number == null || hex.flooded) return;
    // Shrinking board: a hex that is about to go under is worth far less.
    const survival = doomed.has(hexId) ? 0.3 : 1;
    score += (PIP_VALUE[hex.number] || 0) * survival;
    if (hex.resource && survival === 1) seenResources.add(hex.resource);
  });
  score += seenResources.size * 0.75;
  if (intersection.harbor) {
    score += intersection.harbor.type === "generic" ? 0.5 : 1.25;
  }
  return score;
}

// Highest-VP opponent — the player that Hard-difficulty bots try to slow down.
function getLeaderId(G, playerID) {
  let leader = null;
  let bestVP = -Infinity;
  Object.entries(G.players).forEach(([pid, p]) => {
    if (pid === playerID) return;
    const vp = p.victoryPoints || 0;
    if (vp > bestVP) {
      bestVP = vp;
      leader = pid;
    }
  });
  return leader;
}

// On Hard, spots that also touch the leader's territory (denying them future
// expansion) get a small bump on top of raw production value.
function blockingBonus(G, playerID, intersectionId, difficulty) {
  if (difficulty !== "hard") return 0;
  const leader = getLeaderId(G, playerID);
  if (!leader) return 0;
  const intersection = G.board.intersections[intersectionId];
  if (!intersection) return 0;
  const leaderHexes = new Set();
  allBuildings(G.players[leader]).forEach((b) => {
    (b.adjacentHexes || []).forEach((h) => leaderHexes.add(h));
  });
  const shared = (intersection.adjacentHexes || []).filter((h) => leaderHexes.has(h));
  return shared.length * 0.5;
}

function bestOpenIntersection(G, playerID, { requireRoadConnection, difficulty = DEFAULT_DIFFICULTY }) {
  const candidates = Object.keys(G.board.intersections).filter((id) => {
    if (isIntersectionOccupied(G, id)) return false;
    if (isIntersectionSubmerged(G, id)) return false;
    if (!isDistanceRuleMet(G, id)) return false;
    if (requireRoadConnection && !isIntersectionConnectedToPlayerRoad(G, playerID, id)) {
      return false;
    }
    return true;
  });

  if (difficulty === "easy") {
    // Easy bots don't evaluate the board — they just grab any legal spot.
    return pickRandom(candidates);
  }

  let best = null;
  let bestScore = -Infinity;
  candidates.forEach((id) => {
    const score = intersectionProductionScore(G, id) + blockingBonus(G, playerID, id, difficulty);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });
  return best;
}

function bestSettlementToUpgrade(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const player = G.players[playerID];
  if (!player.settlements.length) return null;

  if (difficulty === "easy") {
    return pickRandom(player.settlements).id;
  }

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

function bestSetupRoad(G, settlement, difficulty = DEFAULT_DIFFICULTY) {
  const intersection = G.board.intersections[settlement.id];
  if (!intersection) return null;
  const edges = intersection.adjacentEdges || [];

  if (difficulty === "easy") {
    return pickRandom(edges);
  }

  let best = null;
  let bestScore = -Infinity;
  edges.forEach((edgeId) => {
    const edge = G.board.edges[edgeId];
    if (!edge) return;
    if (isEdgeSubmerged(G, edgeId)) return;
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

function bestExpansionRoad(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const player = G.players[playerID];
  const owned = new Set(allBuildings(player).map((b) => b.id));
  const candidates = [...edgesConnectedToPlayer(G, playerID)].filter(
      (id) => isEdgeFree(G, id) && !isEdgeSubmerged(G, id),
  );

  if (difficulty === "easy") {
    return pickRandom(candidates);
  }

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

function decidePlayerTradeOffer(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  if (G.activeOffer) return null;

  const player = G.players[playerID];
  const others = Object.keys(G.players).filter((pid) => pid !== playerID);
  if (!others.length) return null;

  if (difficulty === "easy") {
    // Easy bots trade on a whim — no goal-tracking, no ratio sense.
    if (Math.random() > 0.35) return null;
    const ALL = ["brick", "lumber", "grain", "wool", "ore"];
    const haveSome = ALL.filter((r) => (player.resources[r] || 0) > 0);
    const giveType = pickRandom(haveSome);
    if (!giveType) return null;
    const receiveType = pickRandom(ALL.filter((r) => r !== giveType));
    if (!receiveType) return null;
    return {
      move: "offerTrade",
      args: [
        {
          targetPlayerId: pickRandom(others),
          give: { type: giveType, amount: 1 },
          receive: { type: receiveType, amount: 1 },
        },
      ],
    };
  }

  if (Math.random() > 0.45) return null;

  const goal = currentGoal(G, playerID);
  if (!goal) return null;

  const needType = missingResource(player, goal.cost);
  if (!needType) return null;

  const giveType = surplusResource(player, goal.cost);
  if (!giveType || giveType === needType) return null;

  // Hard bots avoid feeding the current leader resources it needs.
  const leader = difficulty === "hard" ? getLeaderId(G, playerID) : null;
  const tradePartners = leader ? others.filter((pid) => pid !== leader) : others;

  let target = null;
  let bestHave = 0;
  (tradePartners.length ? tradePartners : others).forEach((pid) => {
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

function decideRobberPlacement(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const candidates = G.board.hexes.filter(
      (h) => h.id !== G.board.robberPosition && !h.flooded,
  );

  if (difficulty === "easy") {
    // Easy bots ignore robber strategy entirely — pure random placement.
    return pickRandom(candidates)?.id || null;
  }

  const leader = difficulty === "hard" ? getLeaderId(G, playerID) : null;

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
          let weight = isUpgraded ? 2 : 1;
          // Hard bots specifically hunt for the current leader's hexes.
          if (difficulty === "hard" && pid === leader) weight += 2;
          value += weight;
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

function decideTradeResponse(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const offer = G.activeOffer;
  if (!offer || String(offer.to) !== String(playerID)) return null;
  const player = G.players[playerID];
  const canPay = (player.resources[offer.receive.type] || 0) >= offer.receive.amount;
  if (!canPay) return { move: "cancelTrade", args: [] };

  if (difficulty === "easy") {
    // Easy bots barely evaluate fairness — mostly just accept if they can pay.
    if (Math.random() < 0.85) return { move: "acceptTrade", args: [] };
    return { move: "cancelTrade", args: [] };
  }

  if (difficulty === "hard") {
    // Hard bots only accept trades that are strictly good for them, and are
    // extra reluctant to help whoever is currently in the lead.
    const strictlyFavorable = offer.give.amount > offer.receive.amount;
    const fromLeader = String(offer.from) === String(getLeaderId(G, playerID));
    if (strictlyFavorable && !fromLeader) return { move: "acceptTrade", args: [] };
    if (offer.give.amount >= offer.receive.amount + 1 && fromLeader) {
      return { move: "acceptTrade", args: [] };
    }
    return { move: "cancelTrade", args: [] };
  }

  const looksFair = offer.give.amount >= offer.receive.amount;
  if (looksFair) return { move: "acceptTrade", args: [] };
  return { move: "cancelTrade", args: [] };
}

function decideBankTrade(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  if (G.activeOffer && String(G.activeOffer.from) === String(playerID)) {
    return null;
  }

  const player = G.players[playerID];
  const resources = player.resources;

  if (difficulty === "easy") {
    // Easy bots trade away a random resource once they have enough of it,
    // without regard for what they actually need.
    const ALL = ["brick", "lumber", "grain", "wool", "ore"];
    const tradeable = ALL.filter((r) => {
      const ratio = getBestBankRatio(G, playerID, r);
      return (resources[r] || 0) >= ratio && (G.bank?.[r] || 0) >= 0;
    });
    const giveType = pickRandom(tradeable);
    if (!giveType) return null;
    const wanted = pickRandom(ALL.filter((r) => r !== giveType && (G.bank?.[r] || 0) > 0));
    if (!wanted) return null;
    return { move: "tradeWithBank", args: [{ give: giveType, receive: wanted }] };
  }

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

function decideSetupAction(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const player = G.players[playerID];
  if (player.settlements.length === player.roads.length) {
    if (player.settlements.length >= 2) return null;
    const spot = bestOpenIntersection(G, playerID, { requireRoadConnection: false, difficulty });
    return spot ? { move: "buildSettlement", args: [spot] } : null;
  }
  const lastSettlement = player.settlements[player.settlements.length - 1];
  if (!lastSettlement) return null;
  const edge = bestSetupRoad(G, lastSettlement, difficulty);
  return edge ? { move: "buildRoad", args: [edge] } : null;
}

function decideDraftAction(G, playerID, difficulty = DEFAULT_DIFFICULTY) {
  const draft = G.draft;
  if (!draft || draft.complete) return null;
  // Already picked this round — wait for the table (re-sending would just be rejected).
  if (hasPickedThisRound(draft, playerID)) return null;

  const pack = getCurrentPack(draft, playerID);
  if (!pack || pack.cards.length === 0) return null;

  // Easy bots grab whatever; everyone else takes the best-scoring card.
  const card = difficulty === "easy" ? pickRandom(pack.cards) : bestDraftCard(pack);
  return card ? { move: "draftPick", args: [card.id] } : null;
}

function decidePlayingAction(G, ctx, playerID, difficulty = DEFAULT_DIFFICULTY) {
  if (!G.diceRolled) return { move: "rollDice", args: [] };
  if (G.activeOffer && String(G.activeOffer.from) === String(playerID)) {
    return null;
  }

  const player = G.players[playerID];

  if (!G.devCardPlayedThisTurn && hasPlayableCard(player, "knight", G.turnCount)) {
    const robberOnSelf = playerTouchesHex(G, playerID, G.board.robberPosition);
    // Hard bots also play knights proactively when close to Largest Army.
    const chasingLargestArmy = difficulty === "hard" && player.knightsPlayed === 2;
    if (robberOnSelf || chasingLargestArmy) {
      return { move: "playKnight", args: [] };
    }
  }

  if (canAfford(player.resources, COSTS.city)) {
    const target = bestSettlementToUpgrade(G, playerID, difficulty);
    if (target) return { move: "buildCity", args: [target] };
  }

  const reachableSpot = bestOpenIntersection(G, playerID, { requireRoadConnection: true, difficulty });

  if (canAfford(player.resources, COSTS.settlement) && reachableSpot) {
    return { move: "buildSettlement", args: [reachableSpot] };
  }

  if (!reachableSpot && canAfford(player.resources, COSTS.road)) {
    const edge = bestExpansionRoad(G, playerID, difficulty);
    if (edge) return { move: "buildRoad", args: [edge] };
  }

  const devCardBuyChance = difficulty === "easy" ? 0.3 : difficulty === "hard" ? 0.7 : 0.6;
  if (
      canAfford(player.resources, DEV_CARD_COST) &&
      (G.devCardDeck?.length || 0) > 0 &&
      Math.random() < devCardBuyChance
  ) {
    return { move: "buyDevelopmentCard", args: [] };
  }

  const playerTrade = decidePlayerTradeOffer(G, playerID, difficulty);
  if (playerTrade) return playerTrade;

  const trade = decideBankTrade(G, playerID, difficulty);
  if (trade) return trade;

  return { move: "__endTurn__", args: [] };
}

export function decideAction({ G, ctx, playerID, stage, difficulty }) {
  if (!G || !ctx) return null;
  const level = normalizeDifficulty(difficulty);

  if (ctx.phase === "draft") {
    if (stage !== "drafting") return null;
    return decideDraftAction(G, playerID, level);
  }

  if (ctx.phase === "setup") {
    if (stage !== "placing") return null;
    return decideSetupAction(G, playerID, level);
  }

  if (ctx.phase === "main") {
    if (stage === "responding") return decideTradeResponse(G, playerID, level);
    if (stage === "placingRobber") {
      const hexId = decideRobberPlacement(G, playerID, level);
      return hexId ? { move: "placeRobber", args: [hexId] } : null;
    }
    if (stage === "playing") return decidePlayingAction(G, ctx, playerID, level);
  }

  return null;
}