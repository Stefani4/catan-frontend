export const PLAYER_COLORS = [
  { name: "Red", colorKey: "colorRed", accent: "#c0392b", soft: "#e74c3c", bg: "#3a1512" },
  { name: "Blue", colorKey: "colorBlue", accent: "#1f5c99", soft: "#2f80c4", bg: "#0f2438" },
  { name: "Green", colorKey: "colorGreen", accent: "#1e8449", soft: "#27ae60", bg: "#12301f" },
  { name: "Orange", colorKey: "colorOrange", accent: "#c0641b", soft: "#e67e22", bg: "#3a2109" },
  { name: "Yellow", colorKey: "colorYellow", accent: "#b8960c", soft: "#f1c40f", bg: "#3a3009" },
  { name: "Purple", colorKey: "colorPurple", accent: "#7d3c98", soft: "#9b59b6", bg: "#26123a" },
  { name: "Pink", colorKey: "colorPink", accent: "#c2185b", soft: "#ff69b4", bg: "#3a1226" },
  { name: "Cyan", colorKey: "colorCyan", accent: "#0e8f9e", soft: "#00bcd4", bg: "#0a2f36" },
  { name: "Lavender", colorKey: "colorLavender", accent: "#7986cb", soft: "#b39ddb", bg: "#1e2038" },
];

export function getPlayerColor(id) {
  const idx = Math.abs(parseInt(id, 10)) % PLAYER_COLORS.length;
  return PLAYER_COLORS[idx] ?? PLAYER_COLORS[0];
}

export function getColorByIndex(index) {
  return PLAYER_COLORS[index] ?? PLAYER_COLORS[0];
}