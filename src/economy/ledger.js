// ---------------------------------------------------------------------------
// Wallet ledger — pure, immutable state transitions (no storage, no clock).
//
//  * balance is never edited directly; it only changes through credit()/debit()
//    which append a ledger entry, so the history always explains the balance
//  * every credit can carry an idempotency `key` — crediting the same key twice
//    is a no-op, which is what stops a page refresh from re-paying a match
//  * the entry list is capped; what falls off is folded into `archivedNet`, so
//    balance === archivedNet + sum(entries) always holds (verifyWallet)
// ---------------------------------------------------------------------------
import { CATALOG, DEFAULT_ITEMS, getItem, isDefaultItem } from "./catalog.js";

export const WALLET_VERSION = 1;
export const WELCOME_BONUS = 100;
export const MAX_LEDGER_ENTRIES = 100;
export const MAX_PROCESSED_KEYS = 400;
export const MAX_RECEIPTS = 20;

export function createWallet(now = Date.now()) {
  const wallet = {
    version: WALLET_VERSION,
    balance: 0,
    archivedNet: 0,
    entries: [],
    processedKeys: [],
    receipts: {},
    owned: Object.values(DEFAULT_ITEMS),
    equipped: { ...DEFAULT_ITEMS },
    stats: { matches: 0, wins: 0, winsByMode: {}, unlocked: [] },
    seq: 0,
  };
  return credit(wallet, { amount: WELCOME_BONUS, reason: "welcome", key: "welcome", now }).wallet;
}

function appendEntry(wallet, entry) {
  const seq = wallet.seq + 1;
  let entries = [...wallet.entries, { id: `tx_${seq}`, ...entry }];
  let archivedNet = wallet.archivedNet;
  if (entries.length > MAX_LEDGER_ENTRIES) {
    const dropped = entries.slice(0, entries.length - MAX_LEDGER_ENTRIES);
    archivedNet += dropped.reduce((sum, e) => sum + e.amount, 0);
    entries = entries.slice(-MAX_LEDGER_ENTRIES);
  }
  return { ...wallet, seq, entries, archivedNet };
}

/** Adds currency. Returns { wallet, applied }. `applied` is false for a duplicate key. */
export function credit(wallet, { amount, reason, key = null, meta = null, now = Date.now() }) {
  if (!Number.isInteger(amount) || amount <= 0) return { wallet, applied: false, error: "invalid_amount" };
  if (key && wallet.processedKeys.includes(key)) return { wallet, applied: false, error: "duplicate" };
  let next = appendEntry(wallet, { ts: now, amount, reason, meta });
  next = {
    ...next,
    balance: wallet.balance + amount,
    processedKeys: key ? [...wallet.processedKeys, key].slice(-MAX_PROCESSED_KEYS) : wallet.processedKeys,
  };
  return { wallet: next, applied: true };
}

/** Removes currency. Refuses to overdraw. */
export function debit(wallet, { amount, reason, meta = null, now = Date.now() }) {
  if (!Number.isInteger(amount) || amount <= 0) return { wallet, applied: false, error: "invalid_amount" };
  if (wallet.balance < amount) return { wallet, applied: false, error: "insufficient_funds" };
  const next = appendEntry(wallet, { ts: now, amount: -amount, reason, meta });
  return { wallet: { ...next, balance: wallet.balance - amount }, applied: true };
}

export function purchase(wallet, itemId, now = Date.now()) {
  const item = getItem(itemId);
  if (!item) return { wallet, ok: false, error: "unknown_item" };
  if (wallet.owned.includes(itemId)) return { wallet, ok: false, error: "already_owned" };
  const paid = debit(wallet, { amount: item.price, reason: "purchase", meta: { itemId }, now });
  if (!paid.applied) return { wallet, ok: false, error: paid.error };
  return { wallet: { ...paid.wallet, owned: [...paid.wallet.owned, itemId] }, ok: true };
}

export function equip(wallet, itemId) {
  const item = getItem(itemId);
  if (!item) return { wallet, ok: false, error: "unknown_item" };
  if (!wallet.owned.includes(itemId)) return { wallet, ok: false, error: "not_owned" };
  return { wallet: { ...wallet, equipped: { ...wallet.equipped, [item.category]: itemId } }, ok: true };
}

/** Sum of today's earnings for a reason (used for the daily match-income cap). */
export function earnedOnDay(wallet, reason, now = Date.now()) {
  const day = new Date(now).toDateString();
  return wallet.entries
      .filter((e) => e.reason === reason && e.amount > 0 && new Date(e.ts).toDateString() === day)
      .reduce((sum, e) => sum + e.amount, 0);
}

export function verifyWallet(wallet) {
  const sum = wallet.entries.reduce((s, e) => s + e.amount, 0);
  return wallet.balance === wallet.archivedNet + sum && wallet.balance >= 0;
}

/** Repairs/validates data loaded from storage. Returns null if it can't be trusted. */
export function sanitizeWallet(raw) {
  if (!raw || typeof raw !== "object" || raw.version !== WALLET_VERSION) return null;
  if (!Number.isInteger(raw.balance) || !Array.isArray(raw.entries) || !Array.isArray(raw.owned)) return null;
  const owned = [...new Set([...Object.values(DEFAULT_ITEMS), ...raw.owned.filter((id) => getItem(id))])];
  const equipped = { ...DEFAULT_ITEMS };
  Object.entries(raw.equipped || {}).forEach(([cat, id]) => {
    const item = getItem(id);
    if (item && item.category === cat && owned.includes(id)) equipped[cat] = id;
  });
  const wallet = {
    version: WALLET_VERSION,
    balance: raw.balance,
    archivedNet: Number.isInteger(raw.archivedNet) ? raw.archivedNet : 0,
    entries: raw.entries.filter((e) => e && Number.isInteger(e.amount)),
    processedKeys: Array.isArray(raw.processedKeys) ? raw.processedKeys : [],
    receipts: raw.receipts && typeof raw.receipts === "object" ? raw.receipts : {},
    owned,
    equipped,
    stats: { matches: 0, wins: 0, winsByMode: {}, unlocked: [], ...(raw.stats || {}) },
    seq: Number.isInteger(raw.seq) ? raw.seq : raw.entries.length,
  };
  return verifyWallet(wallet) ? wallet : null;
}

export { CATALOG, isDefaultItem };
