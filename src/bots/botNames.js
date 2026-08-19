export const BOT_NAMES = [
  "Barbarian Bjorn",
  "Trader Tilda",
  "Baron Otto",
  "Merchant Mira",
  "Rover Ragnar",
];

export function botDisplayName(index) {
  const base = BOT_NAMES[index % BOT_NAMES.length];
  return `🤖 ${base}`;
}
