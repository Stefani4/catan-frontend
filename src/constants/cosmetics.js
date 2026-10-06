import { getAvatarFrame, getPieceSkin } from "../economy/catalog.js";

/** Style + className for the ring drawn around an avatar circle. */
export function getFrameProps(frameId, { compact = false } = {}) {
  const ring = getAvatarFrame(frameId)?.ring;
  if (!ring) return { style: {}, className: "" };
  const shadows = [];
  if (ring.double) shadows.push(`0 0 0 ${compact ? 1 : 2}px ${ring.double}`);
  shadows.push(`0 0 ${compact ? 4 : 8}px ${compact ? 1 : 2}px ${ring.glow}`);
  return {
    style: { border: `${compact ? 1.5 : ring.width}px solid ${ring.border}`, boxShadow: shadows.join(", ") },
    className: ring.animated ? "frame-animated" : "",
  };
}

/** CSS filter for a piece skin (never shifts hue, so team colours stay readable). */
export function getSkinFilter(skinId) {
  const f = getPieceSkin(skinId)?.filter;
  return f && f !== "none" ? f : undefined;
}
