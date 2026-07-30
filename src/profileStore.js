import { PLAYER_COLORS } from "./constants/playerColors.js";
import { AVATARS } from "./constants/avatars.jsx";

export const PROFILE_KEY = "catan_player_profile";
const PROFILE_EVENT = "catan-profile-changed";

const LEGACY_NAME_KEY = "catan_player_name";

const DEFAULT_PROFILE = {
  name: "Player 1",
  colorIndex: 0,
  avatarId: AVATARS[0].id,
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {
    //ignore
  }
  const legacyName = localStorage.getItem(LEGACY_NAME_KEY);
  return { ...DEFAULT_PROFILE, ...(legacyName ? { name: legacyName } : {}) };
}

export function saveProfile(partial) {
  const next = { ...loadProfile(), ...partial };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  localStorage.setItem(LEGACY_NAME_KEY, next.name);
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: next }));
  return next;
}

export function subscribeToProfile(callback) {
  callback(loadProfile());
  const handler = (e) => callback(e.detail || loadProfile());
  window.addEventListener(PROFILE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_EVENT, handler);
}

export function encodePlayerIdentity(profile = loadProfile()) {
  return JSON.stringify({
    n: (profile.name || "Player").slice(0, 20),
    c: Number.isInteger(profile.colorIndex) ? profile.colorIndex : 0,
    a: profile.avatarId || AVATARS[0].id,
  });
}

export function decodePlayerIdentity(rawName, seatId) {
  if (typeof rawName === "string" && rawName.length > 0) {
    try {
      const parsed = JSON.parse(rawName);
      if (parsed && typeof parsed.n === "string") {
        return {
          name: parsed.n,
          colorIndex: Number.isInteger(parsed.c) ? parsed.c : seatColorIndex(seatId),
          avatarId: parsed.a || null,
          isEncoded: true,
        };
      }
    } catch {
      //ignore
    }
  }
  return {
    name: rawName || `Player ${seatId}`,
    colorIndex: seatColorIndex(seatId),
    avatarId: null,
    isEncoded: false,
  };
}

function seatColorIndex(seatId) {
  return Math.abs(parseInt(seatId, 10) || 0) % PLAYER_COLORS.length;
}
