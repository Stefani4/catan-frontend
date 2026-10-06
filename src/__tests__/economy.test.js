import { describe, it, expect, beforeEach } from "vitest";
import { CATALOG, CATEGORIES, DEFAULT_ITEMS, getItem, sanitizeCosmeticId } from "../economy/catalog.js";
import { createWallet, credit, debit, purchase, equip, verifyWallet, sanitizeWallet, earnedOnDay, WELCOME_BONUS, MAX_LEDGER_ENTRIES } from "../economy/ledger.js";
import { computeMatchPayout, applyMatchResult, REWARD_RULES, ACHIEVEMENTS } from "../economy/rewards.js";
import { loadWallet, saveWallet, buyItem, equipItem, claimMatchRewards, WALLET_KEY, WALLET_BACKUP_KEY, getEquippedCosmetics } from "../economy/walletStore.js";
import { encodePlayerIdentity, decodePlayerIdentity } from "../profileStore.js";

beforeEach(() => localStorage.clear());

describe("catalog integrity", () => {
  it("has unique ids, valid categories and a free default for every category", () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    CATALOG.forEach((i) => {
      expect(CATEGORIES).toContain(i.category);
      expect(i.price).toBeGreaterThanOrEqual(0);
    });
    Object.entries(DEFAULT_ITEMS).forEach(([cat, id]) => {
      expect(getItem(id).category).toBe(cat);
      expect(getItem(id).price).toBe(0);
    });
    CATALOG.filter((i) => !Object.values(DEFAULT_ITEMS).includes(i.id)).forEach((i) => expect(i.price).toBeGreaterThan(0));
  });
  it("keeps wire ids short (they travel in the identity string)", () => {
    CATALOG.forEach((i) => expect(i.id.length).toBeLessThanOrEqual(10));
  });
  it("sanitizeCosmeticId only accepts ids of the right category", () => {
    expect(sanitizeCosmeticId("pieceSkin", "gilded")).toBe("gilded");
    expect(sanitizeCosmeticId("pieceSkin", "laurel")).toBeNull();
    expect(sanitizeCosmeticId("avatarFrame", "<script>")).toBeNull();
    expect(sanitizeCosmeticId("avatarFrame", 42)).toBeNull();
  });
});

describe("ledger", () => {
  it("starts with the welcome bonus and the default items", () => {
    const w = createWallet(1);
    expect(w.balance).toBe(WELCOME_BONUS);
    expect(w.owned).toEqual(expect.arrayContaining(Object.values(DEFAULT_ITEMS)));
    expect(verifyWallet(w)).toBe(true);
  });

  it("rejects invalid amounts and overdrafts without changing the wallet", () => {
    const w = createWallet(1);
    expect(credit(w, { amount: -5, reason: "x" }).applied).toBe(false);
    expect(credit(w, { amount: 1.5, reason: "x" }).applied).toBe(false);
    const d = debit(w, { amount: w.balance + 1, reason: "x" });
    expect(d.applied).toBe(false);
    expect(d.wallet).toBe(w);
  });

  it("idempotency key makes a repeated credit a no-op", () => {
    let w = createWallet(1);
    w = credit(w, { amount: 10, reason: "match", key: "k1" }).wallet;
    const again = credit(w, { amount: 10, reason: "match", key: "k1" });
    expect(again.applied).toBe(false);
    expect(again.wallet.balance).toBe(w.balance);
  });

  it("purchase deducts once, grants the item, and can't be repeated or overdrawn", () => {
    let w = credit(createWallet(1), { amount: 500, reason: "t" }).wallet;
    const item = getItem("gilded");
    const bought = purchase(w, "gilded");
    expect(bought.ok).toBe(true);
    expect(bought.wallet.balance).toBe(w.balance - item.price);
    expect(bought.wallet.owned).toContain("gilded");
    expect(purchase(bought.wallet, "gilded").error).toBe("already_owned");
    expect(purchase(createWallet(1), "neon").error).toBe("insufficient_funds");
    expect(purchase(w, "nope").error).toBe("unknown_item");
  });

  it("only owned items can be equipped, one per category", () => {
    let w = credit(createWallet(1), { amount: 500, reason: "t" }).wallet;
    expect(equip(w, "gilded").error).toBe("not_owned");
    w = purchase(w, "gilded").wallet;
    w = equip(w, "gilded").wallet;
    expect(w.equipped.pieceSkin).toBe("gilded");
    expect(w.equipped.boardTheme).toBe("seasonal");
  });

  it("balance always equals archived + entries, even after the log is truncated (randomised)", () => {
    let w = createWallet(1);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 400; i++) {
      const amt = 1 + Math.floor(rnd() * 80);
      w = (rnd() < 0.6 ? credit(w, { amount: amt, reason: "r" }) : debit(w, { amount: amt, reason: "d" })).wallet;
      expect(w.balance).toBeGreaterThanOrEqual(0);
    }
    expect(w.entries.length).toBeLessThanOrEqual(MAX_LEDGER_ENTRIES);
    expect(verifyWallet(w)).toBe(true);
  });

  it("sanitizeWallet rejects tampering that breaks the ledger", () => {
    const w = createWallet(1);
    expect(sanitizeWallet(JSON.parse(JSON.stringify(w)))).not.toBeNull();
    expect(sanitizeWallet({ ...w, balance: w.balance + 9999 })).toBeNull();
    expect(sanitizeWallet({ ...w, version: 99 })).toBeNull();
    expect(sanitizeWallet(null)).toBeNull();
  });

  it("sanitizeWallet drops equipped items that aren't owned", () => {
    const w = createWallet(1);
    const out = sanitizeWallet({ ...w, equipped: { ...w.equipped, pieceSkin: "neon" } });
    expect(out.equipped.pieceSkin).toBe("classic");
  });
});

describe("rewards", () => {
  const base = { matchID: "m1", mode: "classic", won: true, humanOpponents: 2, player: { cities: [], resorts: [] }, playerTrades: 0 };

  it("pays participation + win, scaled by mode", () => {
    expect(computeMatchPayout({ won: true, mode: "classic", humanOpponents: 1 }).total).toBe(75);
    expect(computeMatchPayout({ won: false, mode: "classic", humanOpponents: 1 }).total).toBe(15);
    expect(computeMatchPayout({ won: true, mode: "blitz", humanOpponents: 1 }).total).toBe(Math.round(75 * 0.75));
    expect(computeMatchPayout({ won: true, mode: "draft", humanOpponents: 1 }).total).toBe(Math.round(75 * 1.25));
  });

  it("halves bot-only matches and enforces the daily cap", () => {
    expect(computeMatchPayout({ won: true, mode: "classic", humanOpponents: 0 }).total).toBe(Math.round(75 * 0.5));
    const capped = computeMatchPayout({ won: true, mode: "classic", humanOpponents: 1, alreadyEarnedToday: REWARD_RULES.dailyMatchCap - 10 });
    expect(capped.total).toBe(10);
    expect(capped.capped).toBe(true);
    expect(computeMatchPayout({ won: true, mode: "classic", humanOpponents: 1, alreadyEarnedToday: REWARD_RULES.dailyMatchCap }).total).toBe(0);
  });

  it("applying the same match twice pays once and returns the same receipt", () => {
    const w0 = createWallet(1);
    const first = applyMatchResult(w0, base, 5);
    const second = applyMatchResult(first.wallet, base, 6);
    expect(first.firstTime).toBe(true);
    expect(second.firstTime).toBe(false);
    expect(second.wallet.balance).toBe(first.wallet.balance);
    expect(second.receipt).toEqual(first.receipt);
    expect(verifyWallet(first.wallet)).toBe(true);
  });

  it("unlocks achievements exactly once with their one-time reward", () => {
    const first = applyMatchResult(createWallet(1), { ...base, matchID: "a" }, 5);
    expect(first.receipt.achievements.map((a) => a.id)).toContain("first_win");
    const second = applyMatchResult(first.wallet, { ...base, matchID: "b" }, 6);
    expect(second.receipt.achievements.map((a) => a.id)).not.toContain("first_win");
    expect(first.receipt.total).toBe(first.receipt.matchTotal + first.receipt.achievements.reduce((s, a) => s + a.reward, 0));
  });

  it("mode achievements need a win in that mode", () => {
    const loss = applyMatchResult(createWallet(1), { ...base, mode: "blitz", won: false }, 5);
    expect(loss.receipt.achievements.map((a) => a.id)).not.toContain("blitz_victor");
    const win = applyMatchResult(createWallet(1), { ...base, mode: "blitz", won: true }, 5);
    expect(win.receipt.achievements.map((a) => a.id)).toContain("blitz_victor");
  });

  it("every achievement id is unique and has a positive reward", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    ACHIEVEMENTS.forEach((a) => expect(a.reward).toBeGreaterThan(0));
  });

  it("earnedOnDay only counts today's match income", () => {
    const day = Date.UTC(2026, 0, 10, 12);
    let w = credit(createWallet(day), { amount: 40, reason: "match", now: day }).wallet;
    w = credit(w, { amount: 25, reason: "match", now: day - 3 * 86400000 }).wallet;
    expect(earnedOnDay(w, "match", day)).toBe(40);
  });
});

describe("walletStore", () => {
  it("creates and persists a wallet on first load", () => {
    const w = loadWallet();
    expect(w.balance).toBe(WELCOME_BONUS);
    expect(JSON.parse(localStorage.getItem(WALLET_KEY)).balance).toBe(WELCOME_BONUS);
  });

  it("buy + equip round-trips through storage", () => {
    saveWallet(credit(loadWallet(), { amount: 1000, reason: "t" }).wallet);
    expect(buyItem("royal").ok).toBe(true);
    expect(equipItem("royal").ok).toBe(true);
    expect(loadWallet().equipped.avatarFrame).toBe("royal");
    expect(getEquippedCosmetics().frameId).toBe("royal");
  });

  it("keeps a backup of corrupted data instead of silently destroying it", () => {
    localStorage.setItem(WALLET_KEY, "{bad json");
    const w = loadWallet();
    expect(w.balance).toBe(WELCOME_BONUS);
    expect(localStorage.getItem(WALLET_BACKUP_KEY)).toBe("{bad json");
  });

  it("claimMatchRewards is idempotent across calls (page refresh)", () => {
    const s = { matchID: "m9", mode: "classic", won: true, humanOpponents: 1, player: {}, playerTrades: 0 };
    const a = claimMatchRewards(s);
    const bal = loadWallet().balance;
    const b = claimMatchRewards(s);
    expect(b.firstTime).toBe(false);
    expect(loadWallet().balance).toBe(bal);
    expect(b.receipt).toEqual(a.receipt);
  });
});

describe("identity cosmetics", () => {
  it("default identity is unchanged (no extra fields)", () => {
    const id = JSON.parse(encodePlayerIdentity({ name: "A", colorIndex: 1, avatarId: "anchor" }));
    expect(Object.keys(id).sort()).toEqual(["a", "c", "n"]);
  });

  it("includes equipped cosmetics from the wallet and validates them on decode", () => {
    saveWallet(credit(loadWallet(), { amount: 2000, reason: "t" }).wallet);
    buyItem("gilded"); equipItem("gilded"); buyItem("flame"); equipItem("flame");
    const d = decodePlayerIdentity(encodePlayerIdentity({ name: "A", colorIndex: 1, avatarId: "anchor" }), "0");
    expect(d.pieceSkinId).toBe("gilded");
    expect(d.frameId).toBe("flame");
  });

  it("ignores unknown / wrong-category ids from other clients", () => {
    const raw = JSON.stringify({ n: "X", c: 0, a: "anchor", p: "laurel", f: "hax" });
    const d = decodePlayerIdentity(raw, "1");
    expect(d.pieceSkinId).toBeNull();
    expect(d.frameId).toBeNull();
  });

  it("flags bots and never gives them wallet cosmetics", () => {
    saveWallet(credit(loadWallet(), { amount: 2000, reason: "t" }).wallet);
    buyItem("gilded"); equipItem("gilded");
    const d = decodePlayerIdentity(encodePlayerIdentity({ name: "Bot", isBot: true }), "1");
    expect(d.isBot).toBe(true);
    expect(d.pieceSkinId).toBeNull();
  });
});
