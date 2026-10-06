// ---------------------------------------------------------------------------
// Cosmetics catalog — the single source of truth for what can be bought.
//
// Three categories, all purely cosmetic (no gameplay effect):
//   boardTheme  - backdrop + terrain tint for the in-game board (local to you)
//   pieceSkin   - restyles your settlements / cities / roads (seen by everyone)
//   avatarFrame - ring around your avatar (seen by everyone)
//
// Rules for visuals:
//   * Piece skins must NEVER shift hue — players are told apart by piece colour.
//   * Ids are short and globally unique: skin/frame ids travel inside the
//     player-identity string that is stored on the match server.
// ---------------------------------------------------------------------------

export const CATEGORIES = ["boardTheme", "pieceSkin", "avatarFrame"];

export const RARITIES = {
  common: { color: "#9aa5b1", order: 0 },
  rare: { color: "#3b82f6", order: 1 },
  epic: { color: "#a855f7", order: 2 },
  legendary: { color: "#f59e0b", order: 3 },
};

export const DEFAULT_ITEMS = {
  boardTheme: "seasonal",
  pieceSkin: "classic",
  avatarFrame: "none",
};

export const CATALOG = [
  // ---- board themes ------------------------------------------------------
  { id: "seasonal", category: "boardTheme", rarity: "common", price: 0, backdrop: null, hexFilter: "none", swatch: ["#2f6b3a", "#c9a96e"] },
  { id: "parchment", category: "boardTheme", rarity: "common", price: 200,
    backdrop: "radial-gradient(circle at 50% 40%, #e9d8a6, #b99a5b 70%, #7a5a2a)", hexFilter: "sepia(0.55) saturate(0.85) brightness(1.05)", swatch: ["#e9d8a6", "#7a5a2a"] },
  { id: "midnight", category: "boardTheme", rarity: "rare", price: 350,
    backdrop: "radial-gradient(circle at 50% 35%, #1b2a4e, #0a1128 75%)", hexFilter: "brightness(0.78) saturate(1.1) contrast(1.1)", swatch: ["#1b2a4e", "#0a1128"] },
  { id: "candy", category: "boardTheme", rarity: "rare", price: 350,
    backdrop: "linear-gradient(135deg, #ffd1e8, #c9b6ff 55%, #a6e3ff)", hexFilter: "saturate(1.45) brightness(1.1)", swatch: ["#ffd1e8", "#a6e3ff"] },
  { id: "volcanic", category: "boardTheme", rarity: "epic", price: 600,
    backdrop: "radial-gradient(circle at 50% 60%, #7a1d0b, #1e0703 80%)", hexFilter: "sepia(0.35) saturate(1.35) brightness(0.88) contrast(1.15)", swatch: ["#7a1d0b", "#1e0703"] },
  { id: "frozen", category: "boardTheme", rarity: "epic", price: 600,
    backdrop: "linear-gradient(160deg, #e6f6ff, #8cc8f0 55%, #2b6ca3)", hexFilter: "saturate(0.7) brightness(1.15) contrast(0.95)", swatch: ["#e6f6ff", "#2b6ca3"] },

  // ---- piece skins (glow / finish only — hue is never rotated) -----------
  { id: "classic", category: "pieceSkin", rarity: "common", price: 0, filter: "none", swatch: ["#c0392b", "#8a2318"] },
  { id: "gilded", category: "pieceSkin", rarity: "rare", price: 300,
    filter: "saturate(1.25) brightness(1.1) drop-shadow(0 0 3px #ffd75e)", swatch: ["#ffd75e", "#b8860b"] },
  { id: "frosted", category: "pieceSkin", rarity: "rare", price: 300,
    filter: "saturate(0.8) brightness(1.2) drop-shadow(0 0 3px #bfe9ff)", swatch: ["#bfe9ff", "#6aa9d4"] },
  { id: "shadow", category: "pieceSkin", rarity: "epic", price: 450,
    filter: "contrast(1.2) brightness(0.8) drop-shadow(0 0 4px #000)", swatch: ["#2b2b33", "#000"] },
  { id: "neon", category: "pieceSkin", rarity: "legendary", price: 700,
    filter: "saturate(1.8) brightness(1.15) drop-shadow(0 0 6px #fff) drop-shadow(0 0 2px currentColor)", swatch: ["#ff4dff", "#4dffff"] },

  // ---- avatar frames --------------------------------------------------------
  { id: "none", category: "avatarFrame", rarity: "common", price: 0, ring: null },
  { id: "laurel", category: "avatarFrame", rarity: "common", price: 200,
    ring: { border: "#d4af37", glow: "rgba(212,175,55,0.55)", width: 3 } },
  { id: "royal", category: "avatarFrame", rarity: "rare", price: 350,
    ring: { border: "#a855f7", glow: "rgba(168,85,247,0.6)", width: 3, double: "#f5d0fe" } },
  { id: "glacier", category: "avatarFrame", rarity: "epic", price: 500,
    ring: { border: "#7dd3fc", glow: "rgba(125,211,252,0.7)", width: 3, double: "#e0f2fe" } },
  { id: "flame", category: "avatarFrame", rarity: "legendary", price: 750,
    ring: { border: "#fb923c", glow: "rgba(251,146,60,0.85)", width: 3, double: "#fde68a", animated: true } },
];

const BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

export function getItem(id) {
  return BY_ID.get(id) || null;
}

export function itemsByCategory(category) {
  return CATALOG.filter((i) => i.category === category);
}

export function isDefaultItem(id) {
  return Object.values(DEFAULT_ITEMS).includes(id);
}

export function getBoardTheme(id) {
  const item = getItem(id);
  return item && item.category === "boardTheme" ? item : getItem(DEFAULT_ITEMS.boardTheme);
}
export function getPieceSkin(id) {
  const item = getItem(id);
  return item && item.category === "pieceSkin" ? item : getItem(DEFAULT_ITEMS.pieceSkin);
}
export function getAvatarFrame(id) {
  const item = getItem(id);
  return item && item.category === "avatarFrame" ? item : getItem(DEFAULT_ITEMS.avatarFrame);
}

/** Validates an id that arrived over the wire (another player's identity). */
export function sanitizeCosmeticId(category, id) {
  const item = typeof id === "string" ? getItem(id) : null;
  return item && item.category === category ? item.id : null;
}
