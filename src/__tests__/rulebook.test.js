import { describe, it, expect } from "vitest";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import pt from "../locales/pt.json";
import { GAME_MODES, MAP_TYPES, DRAFT_CONFIG, DRAFT_BUNDLES, FLOOD_CONFIG } from "../../game/constants.js";
import { REWARD_RULES } from "../economy/rewards.js";
import { WELCOME_BONUS } from "../economy/ledger.js";

const LOCALES = { en, es, fr, de, pt };
const pageText = (page) =>
  page.blocks.map((b) => (b.type === "list" ? b.items.join(" \n") : b.text)).join(" \n");
const num = (s) => [...s.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => m[0].replace(",", "."));

// New section: 8 pages, starting right after "Victory Points".
const START = 25;
const COUNT = 8;
const OBJECTIVE = 0, SETUP = 2, END = 36;
const TITLE = { modes: 25, blitz: 26, draft: 27, cards: 28, tide: 29, flooded: 30, gold: 31, shop: 32 };

describe("rulebook: structure", () => {
  it("every locale has the same number of pages, all well-formed", () => {
    Object.entries(LOCALES).forEach(([lang, d]) => {
      expect(d.rulesPages, lang).toHaveLength(en.rulesPages.length);
      d.rulesPages.forEach((p, i) => {
        expect(p.title?.trim(), `${lang} page ${i} title`).toBeTruthy();
        expect(p.icon, `${lang} page ${i} icon`).toBeTruthy();
        expect(p.blocks.length, `${lang} page ${i} blocks`).toBeGreaterThan(0);
        p.blocks.forEach((b) => {
          if (b.type === "list") b.items.forEach((it) => expect(it.trim(), `${lang} ${i}`).toBeTruthy());
          else expect(b.text.trim(), `${lang} ${i}`).toBeTruthy();
        });
      });
    });
  });

  it("the new section starts on a left-hand page so related pages share a spread, and the book still ends with the same two pages", () => {
    // The book shows pages (1,2),(3,4)... i.e. odd indices on the left.
    expect(START % 2).toBe(1);
    expect(COUNT % 2).toBe(0);
    expect(en.rulesPages[START].title).toBe("Game Modes");
    expect(en.rulesPages[START + COUNT - 1].title).toBe("The Shop");
    expect(en.rulesPages[en.rulesPages.length - 2].title).toBe("End of the Game");
    expect(en.rulesPages[en.rulesPages.length - 1].title).toBe("Happy Settling");
  });

  it("new and amended pages have the same block structure in every language (nothing left untranslated)", () => {
    const shape = (p) => p.blocks.map((b) => (b.type === "list" ? `list${b.items.length}` : "p")).join(",");
    const idx = [OBJECTIVE, SETUP, END, ...Array.from({ length: COUNT }, (_, i) => START + i)];
    idx.forEach((i) => {
      Object.entries(LOCALES).forEach(([lang, d]) => {
        expect(shape(d.rulesPages[i]), `${lang} page ${i}`).toBe(shape(en.rulesPages[i]));
      });
    });
  });

  it("amended pages point readers to the new rules", () => {
    expect(pageText(en.rulesPages[OBJECTIVE])).toMatch(/Blitz.*6 Victory Points/);
    expect(pageText(en.rulesPages[SETUP])).toMatch(/Draft mode this bonus is replaced/);
    expect(pageText(en.rulesPages[END])).toMatch(/Shrinking mode.*final tide/);
  });
});

describe("rulebook: numbers match the game's real constants", () => {
  const T = (k) => pageText(en.rulesPages[TITLE[k]]);
  const ordinal = (n) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

  it("Blitz", () => {
    const f = GAME_MODES.blitz.forced;
    expect(f.mapType).toBe("compact");
    expect(T("blitz")).toContain(`only ${MAP_TYPES.compact.hexCount} hexes`);
    expect(T("blitz")).toContain(`First to ${f.victoryPointsTarget} Victory Points`);
    expect(T("blitz")).toContain(`${f.turnTimerSeconds}-second`);
    expect(pageText(en.rulesPages[OBJECTIVE])).toContain(`${f.victoryPointsTarget} Victory Points`);
  });

  it("Draft", () => {
    expect(T("draft")).toContain(`pack of ${DRAFT_CONFIG.packSize} cards`);
    expect(T("draft")).toContain(`${DRAFT_CONFIG.picksPerPlayer} rounds`);
    expect(T("draft")).toContain(`${DRAFT_CONFIG.pickSeconds} seconds`);
    expect(T("cards")).toContain(`+${DRAFT_CONFIG.hexClaimBonus} of its resource`);
    const total = (b) => Object.values(b.resources).reduce((a, c) => a + c, 0);
    const commons = new Set(DRAFT_BUNDLES.filter((b) => b.rarity === "common").map(total));
    const rares = new Set(DRAFT_BUNDLES.filter((b) => b.rarity === "rare").map(total));
    expect([...commons]).toEqual([3]); // "3 resource cards"
    expect([...rares]).toEqual([4]); // "a rare bundle gives 4"
    expect(T("cards")).toContain("3 resource cards (a rare bundle gives 4)");
  });

  it("Shrinking board", () => {
    expect(T("tide")).toContain(`After the ${ordinal(FLOOD_CONFIG.firstRound)} full round`);
    expect(T("tide")).toContain(`every ${FLOOD_CONFIG.everyRounds} rounds`);
    expect(T("tide")).toContain(`one hex in every ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][FLOOD_CONFIG.hexesPerEventDivisor]}`);
    expect(T("tide")).toContain(`${Math.max(1, Math.round(19 / FLOOD_CONFIG.hexesPerEventDivisor))} on the standard board`);
    expect(T("flooded")).toContain(`${Math.round(FLOOD_CONFIG.minLandRatio * 100)}% of the starting hexes (at least ${FLOOD_CONFIG.minLandFloor})`);
    expect(T("flooded")).toContain(`one more round`);
    expect(FLOOD_CONFIG.finalGraceRounds).toBe(1);
  });

  it("Gold & rewards", () => {
    expect(T("gold")).toContain(`Finish a match: +${REWARD_RULES.participation}`);
    expect(T("gold")).toContain(`Win a match: +${REWARD_RULES.win} more`);
    expect(T("gold")).toContain(`Blitz ×${REWARD_RULES.modeMultiplier.blitz}`);
    expect(T("gold")).toContain(`Draft and Shrinking ×${REWARD_RULES.modeMultiplier.draft}`);
    expect(REWARD_RULES.modeMultiplier.shrinking).toBe(REWARD_RULES.modeMultiplier.draft);
    expect(REWARD_RULES.botOnlyFactor).toBe(0.5); // "pay half"
    expect(T("gold")).toContain(`capped at ${REWARD_RULES.dailyMatchCap} Gold per day`);
    expect(T("gold")).toContain(`start with ${WELCOME_BONUS} Gold`);
  });

  it("every translation carries the same numbers as the English page", () => {
    for (let i = START; i < START + COUNT; i++) {
      const wanted = new Set(num(pageText(en.rulesPages[i])));
      ["es", "fr", "de", "pt"].forEach((lang) => {
        const have = new Set(num(pageText(LOCALES[lang].rulesPages[i])));
        wanted.forEach((n) => expect(have.has(n), `${lang} page ${i} is missing the number ${n}`).toBe(true));
      });
    }
  });
});
