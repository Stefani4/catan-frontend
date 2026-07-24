// Backs the "Theme" selector in Settings > General. Reuses art already
// shipped with the game (the default menu backdrop, plus the four seasonal
// boards also used in-match — see src/components/Board.jsx) so picking a
// theme actually changes what you see on the Main Menu and Lobby, instead
// of being a purely cosmetic label.

import sunsetBg from "../images/Sunset over a coastal village.png";
import springBg from "../images/springB.png";
import summerBg from "../images/summerB.png";
import autumnBg from "../images/autumnB.png";
import winterBg from "../images/winterB.png";

export const THEME_OPTIONS = [
  { key: "sunset", label: "Sunset Coast (Default)", image: sunsetBg },
  { key: "spring", label: "Spring", image: springBg },
  { key: "summer", label: "Summer", image: summerBg },
  { key: "autumn", label: "Autumn", image: autumnBg },
  { key: "winter", label: "Winter", image: winterBg },
];

export function getThemeImage(themeKey) {
  return (THEME_OPTIONS.find((t) => t.key === themeKey) || THEME_OPTIONS[0]).image;
}
