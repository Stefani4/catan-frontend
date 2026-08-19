import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSettings,
  saveSettings,
  subscribeToSettings,
  toMatchDefaults,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from "../settingsStore.js";

beforeEach(() => {
  localStorage.clear();
});

describe("loadSettings / saveSettings", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("saves and loads custom settings", () => {
    saveSettings({ ...DEFAULT_SETTINGS, showFps: true, masterVolume: 30 });
    const loaded = loadSettings();
    expect(loaded.showFps).toBe(true);
    expect(loaded.masterVolume).toBe(30);
  });

  it("fills in missing fields from defaults (e.g. after an app update)", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ showFps: true }));
    const loaded = loadSettings();
    expect(loaded.showFps).toBe(true);
    expect(loaded.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it("falls back to defaults if localStorage contains broken JSON", () => {
    localStorage.setItem(SETTINGS_KEY, "{invalid");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("subscribeToSettings", () => {
  it("propagates changes to all subscribers", () => {
    const received = [];
    const unsubscribe = subscribeToSettings((s) => received.push(s.animations));
    saveSettings({ ...DEFAULT_SETTINGS, animations: false });
    expect(received).toContain(false);
    unsubscribe();
  });
});

describe("toMatchDefaults", () => {
  it("picks only the settings subset relevant to a new match", () => {
    const settings = { ...DEFAULT_SETTINGS, victoryPointsTarget: 15, showFps: true, theme: "winter" };
    const matchDefaults = toMatchDefaults(settings);
    expect(matchDefaults).toEqual({
      victoryPointsTarget: 15,
      mapType: DEFAULT_SETTINGS.mapType,
      diceMode: DEFAULT_SETTINGS.diceMode,
      seasonsEnabled: DEFAULT_SETTINGS.seasonsEnabled,
      robberPayToClear: DEFAULT_SETTINGS.robberPayToClear,
      resortEnabled: DEFAULT_SETTINGS.resortEnabled,
    });
    expect(matchDefaults.showFps).toBeUndefined();
    expect(matchDefaults.theme).toBeUndefined();
  });
});
