// Single source of truth for the "preferences" saved by the Settings panel
// (src/components/Settings.jsx). Anything in the app that wants to react to
// a preference — live, without a page reload — reads it from here and
// listens for the "catan-settings-changed" event that saveSettings() fires.

export const SETTINGS_KEY = "catan_settings";
export const SETTINGS_EVENT = "catan-settings-changed";

export const DEFAULT_SETTINGS = {
  // General
  language: "English",
  theme: "sunset", // see THEME_OPTIONS in src/theme.js — drives menu/lobby background
  animations: true,
  tutorialHints: true,

  // Gameplay — mirrors GAME_SETTINGS_DEFAULTS in game/constants.js so this
  // panel's choices become the defaults GameSetupModal opens with when
  // creating a new match (see toMatchDefaults() below).
  victoryPointsTarget: 10, // one of VICTORY_POINTS_OPTIONS: 10 | 15 | 20
  mapType: "standard", // one of MAP_TYPES: "standard" | "large"
  diceMode: "standard", // one of DICE_MODES: "standard" | "wheel"
  seasonsEnabled: true,
  robberPayToClear: true,
  resortEnabled: true,
  turnTimer: 60, // seconds allowed to act on your turn — read by TurnTimer.jsx

  // Audio / Video / Controls — no audio engine, renderer, or camera exists
  // in this build yet, so these persist as preferences but don't drive any
  // in-app effect (except graphicsQuality/masterVolume/etc are kept purely
  // cosmetic). fullscreen and showFps ARE wired to real behavior below.
  masterVolume: 70,
  musicVolume: 55,
  soundEffects: 80,
  ambientVolume: 40,
  voiceChat: true,
  graphicsQuality: "High",
  fullscreen: false,
  showFps: false,
  cameraSensitivity: 50,
  invertCamera: false,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
}

// Subscribes to live settings changes (fired by saveSettings, e.g. hitting
// Apply in the Settings panel). Returns an unsubscribe function. Also fires
// once immediately with whatever is currently saved, so callers don't need
// a separate initial loadSettings() call.
export function subscribeToSettings(callback) {
  callback(loadSettings());
  const handler = (e) => callback(e.detail || loadSettings());
  window.addEventListener(SETTINGS_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_EVENT, handler);
}

// Maps the Gameplay section of Settings onto the shape GameSetupModal /
// MatchLoader expect (GAME_SETTINGS_DEFAULTS in game/constants.js), so a
// new match starts pre-filled with the host's saved preferences instead of
// hardcoded defaults.
export function toMatchDefaults(settings = loadSettings()) {
  return {
    victoryPointsTarget: settings.victoryPointsTarget,
    mapType: settings.mapType,
    diceMode: settings.diceMode,
    seasonsEnabled: settings.seasonsEnabled,
    robberPayToClear: settings.robberPayToClear,
    resortEnabled: settings.resortEnabled,
  };
}
