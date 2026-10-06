// ---------------------------------------------------------------------------
// Earning rules. Everything here is pure: (wallet, match summary) -> receipt.
//
// Sources of income
//   * match payout   = (participation + win bonus) x mode multiplier x bot factor,
//                      clamped by a daily cap (anti-farming)
//   * achievements   = one-time bonuses, never capped
//
// Anti-farming: a match against bots only pays half, and match income is capped
// per day. Achievements are one-time so they can't be farmed at all.
// ---------------------------------------------------------------------------
import { credit, earnedOnDay, MAX_RECEIPTS } from "./ledger.js";

export const REWARD_RULES = {
  participation: 15,
  win: 60,
  botOnlyFactor: 0.5,
  dailyMatchCap: 300,
  modeMultiplier: { classic: 1, blitz: 0.75, draft: 1.25, shrinking: 1.25 },
};

/**
 * `ctx` for predicates: { won, mode, player, playerTrades, stats }
 * where `stats` are the lifetime stats INCLUDING the match that just ended.
 */
export const ACHIEVEMENTS = [
  { id: "first_win", reward: 50, check: (c) => c.won && c.stats.wins >= 1 },
  { id: "veteran", reward: 75, check: (c) => c.stats.matches >= 10 },
  { id: "road_warrior", reward: 40, check: (c) => c.won && Boolean(c.player?.hasLongestRoad) },
  { id: "knight_errant", reward: 40, check: (c) => c.won && Boolean(c.player?.hasLargestArmy) },
  { id: "metropolis", reward: 30, check: (c) => c.won && (c.player?.cities?.length || 0) + (c.player?.resorts?.length || 0) >= 3 },
  { id: "resort_tycoon", reward: 40, check: (c) => (c.player?.resorts?.length || 0) >= 1 },
  { id: "silver_tongue", reward: 30, check: (c) => (c.playerTrades || 0) >= 5 },
  { id: "blitz_victor", reward: 60, check: (c) => c.won && c.mode === "blitz" },
  { id: "draft_champion", reward: 60, check: (c) => c.won && c.mode === "draft" },
  { id: "last_island", reward: 60, check: (c) => c.won && c.mode === "shrinking" },
];

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}

/**
 * Builds the match payout WITHOUT touching a wallet. `alreadyEarnedToday` is
 * how much match income was already paid today (for the cap).
 */
export function computeMatchPayout({ won, mode, humanOpponents, alreadyEarnedToday = 0 }) {
  const lines = [{ kind: "participation", amount: REWARD_RULES.participation }];
  if (won) lines.push({ kind: "win", amount: REWARD_RULES.win });

  const base = lines.reduce((s, l) => s + l.amount, 0);
  const modeMult = REWARD_RULES.modeMultiplier[mode] ?? 1;
  const botFactor = humanOpponents === 0 ? REWARD_RULES.botOnlyFactor : 1;

  let total = Math.round(base * modeMult * botFactor);
  const room = Math.max(0, REWARD_RULES.dailyMatchCap - alreadyEarnedToday);
  const capped = total > room;
  if (capped) total = room;

  return { lines, base, modeMult, botFactor, total, capped };
}

/**
 * Applies a finished match to a wallet. Idempotent per `matchID`: calling it
 * again for the same match returns the stored receipt and changes nothing.
 * Returns { wallet, receipt, firstTime }.
 */
export function applyMatchResult(wallet, summary, now = Date.now()) {
  const { matchID } = summary;
  const key = `match:${matchID}`;
  if (wallet.processedKeys.includes(key)) {
    return { wallet, receipt: wallet.receipts[matchID] || null, firstTime: false };
  }

  const payout = computeMatchPayout({
    won: summary.won,
    mode: summary.mode,
    humanOpponents: summary.humanOpponents,
    alreadyEarnedToday: earnedOnDay(wallet, "match", now),
  });

  let next = wallet;
  if (payout.total > 0) {
    next = credit(next, { amount: payout.total, reason: "match", key, meta: { matchID }, now }).wallet;
  } else {
    // Still record the key so a capped/zero payout isn't re-evaluated later.
    next = { ...next, processedKeys: [...next.processedKeys, key] };
  }

  const stats = {
    ...next.stats,
    matches: next.stats.matches + 1,
    wins: next.stats.wins + (summary.won ? 1 : 0),
    winsByMode: {
      ...next.stats.winsByMode,
      ...(summary.won ? { [summary.mode]: (next.stats.winsByMode[summary.mode] || 0) + 1 } : {}),
    },
  };
  next = { ...next, stats };

  const unlocked = [];
  ACHIEVEMENTS.forEach((a) => {
    if (next.stats.unlocked.includes(a.id)) return;
    const ok = a.check({
      won: summary.won,
      mode: summary.mode,
      player: summary.player,
      playerTrades: summary.playerTrades,
      stats: next.stats,
    });
    if (!ok) return;
    const res = credit(next, { amount: a.reward, reason: "achievement", key: `ach:${a.id}`, meta: { id: a.id }, now });
    next = { ...res.wallet, stats: { ...res.wallet.stats, unlocked: [...res.wallet.stats.unlocked, a.id] } };
    unlocked.push({ id: a.id, reward: a.reward });
  });

  const receipt = {
    matchID,
    won: summary.won,
    mode: summary.mode,
    lines: payout.lines,
    modeMult: payout.modeMult,
    botFactor: payout.botFactor,
    capped: payout.capped,
    matchTotal: payout.total,
    achievements: unlocked,
    total: payout.total + unlocked.reduce((s, a) => s + a.reward, 0),
  };

  const ids = Object.keys(next.receipts);
  const receipts = { ...next.receipts, [matchID]: receipt };
  if (ids.length >= MAX_RECEIPTS) delete receipts[ids[0]];
  return { wallet: { ...next, receipts }, receipt, firstTime: true };
}
