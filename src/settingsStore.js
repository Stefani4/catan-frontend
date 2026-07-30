export const SETTINGS_KEY = "catan_settings";
export const SETTINGS_EVENT = "catan-settings-changed";

export const DEFAULT_SETTINGS = {
  language: "English",
  theme: "sunset",
  animations: true,
  tutorialHints: true,
  victoryPointsTarget: 10,
  mapType: "standard",
  diceMode: "standard",
  seasonsEnabled: true,
  robberPayToClear: true,
  resortEnabled: true,
  turnTimer: 60,
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

export function subscribeToSettings(callback) {
  callback(loadSettings());
  const handler = (e) => callback(e.detail || loadSettings());
  window.addEventListener(SETTINGS_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_EVENT, handler);
}

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
