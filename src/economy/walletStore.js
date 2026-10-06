// Persistence + subscription layer for the wallet, mirroring profileStore /
// settingsStore. The wallet is stored client-side, so it is NOT tamper-proof:
// fine for cosmetics, but a server-authoritative ledger would be needed before
// currency could ever have real value (see README).
import { createWallet, sanitizeWallet, purchase, equip } from "./ledger.js";
import { applyMatchResult } from "./rewards.js";
import { DEFAULT_ITEMS } from "./catalog.js";

export const WALLET_KEY = "catan_wallet_v1";
export const WALLET_BACKUP_KEY = "catan_wallet_corrupt_backup";
export const WALLET_EVENT = "catan-wallet-changed";

export function loadWallet() {
  let raw = null;
  try {
    raw = localStorage.getItem(WALLET_KEY);
  } catch {
    // storage unavailable — fall through to a fresh in-memory wallet
  }
  if (raw) {
    try {
      const wallet = sanitizeWallet(JSON.parse(raw));
      if (wallet) return wallet;
    } catch {
      // fall through
    }
    // Corrupt or tampered: keep a copy instead of silently destroying it.
    try {
      localStorage.setItem(WALLET_BACKUP_KEY, raw);
    } catch {
      // ignore
    }
  }
  const fresh = createWallet();
  saveWallet(fresh, false);
  return fresh;
}

export function saveWallet(wallet, notify = true) {
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch {
    // ignore (private mode / quota)
  }
  if (notify) window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: wallet }));
  return wallet;
}

export function subscribeToWallet(callback) {
  callback(loadWallet());
  const onChange = (e) => callback(e.detail || loadWallet());
  // Another tab changed the wallet.
  const onStorage = (e) => {
    if (e.key === WALLET_KEY) callback(loadWallet());
  };
  window.addEventListener(WALLET_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(WALLET_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Always reads the freshest copy first so two tabs can't clobber each other's transaction. */
function transact(fn) {
  const result = fn(loadWallet());
  if (result.wallet) saveWallet(result.wallet);
  return result;
}

export function buyItem(itemId) {
  return transact((w) => purchase(w, itemId));
}

export function equipItem(itemId) {
  return transact((w) => equip(w, itemId));
}

export function claimMatchRewards(summary) {
  return transact((w) => applyMatchResult(w, summary));
}

/** The cosmetics other players need to see (sent inside the player identity). */
export function getEquippedCosmetics() {
  const { equipped } = loadWallet();
  return {
    pieceSkinId: equipped.pieceSkin !== DEFAULT_ITEMS.pieceSkin ? equipped.pieceSkin : null,
    frameId: equipped.avatarFrame !== DEFAULT_ITEMS.avatarFrame ? equipped.avatarFrame : null,
  };
}

export function getEquippedBoardTheme() {
  return loadWallet().equipped.boardTheme;
}
