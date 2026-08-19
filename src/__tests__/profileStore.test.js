import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProfile,
  saveProfile,
  subscribeToProfile,
  encodePlayerIdentity,
  decodePlayerIdentity,
  PROFILE_KEY,
} from "../profileStore.js";
import { AVATARS } from "../constants/avatars.jsx";

beforeEach(() => {
  localStorage.clear();
});

describe("loadProfile / saveProfile", () => {
  it("returns the default profile when nothing is in localStorage", () => {
    const profile = loadProfile();
    expect(profile.name).toBe("Player 1");
    expect(profile.colorIndex).toBe(0);
    expect(profile.avatarId).toBe(AVATARS[0].id);
  });

  it("saveProfile stores it and loadProfile returns the same profile", () => {
    saveProfile({ name: "Viktor", colorIndex: 2 });
    const profile = loadProfile();
    expect(profile.name).toBe("Viktor");
    expect(profile.colorIndex).toBe(2);
  });

  it("saveProfile merges into the existing profile instead of replacing it", () => {
    saveProfile({ name: "Viktor", colorIndex: 2, avatarId: "avatar_3" });
    saveProfile({ colorIndex: 4 });
    const profile = loadProfile();
    expect(profile.name).toBe("Viktor");
    expect(profile.colorIndex).toBe(4);
    expect(profile.avatarId).toBe("avatar_3");
  });

  it("falls back to the legacy name key (catan_player_name) if no new profile exists", () => {
    localStorage.setItem("catan_player_name", "OldName");
    const profile = loadProfile();
    expect(profile.name).toBe("OldName");
  });

  it("does not throw if localStorage contains broken JSON", () => {
    localStorage.setItem(PROFILE_KEY, "{invalid json");
    expect(() => loadProfile()).not.toThrow();
  });
});

describe("subscribeToProfile", () => {
  it("immediately calls the callback with the current profile", () => {
    saveProfile({ name: "First" });
    let received = null;
    const unsubscribe = subscribeToProfile((p) => {
      received = p;
    });
    expect(received.name).toBe("First");
    unsubscribe();
  });

  it("calls the callback again when the profile changes", () => {
    const calls = [];
    const unsubscribe = subscribeToProfile((p) => calls.push(p.name));
    saveProfile({ name: "Second" });
    expect(calls).toContain("Second");
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const calls = [];
    const unsubscribe = subscribeToProfile((p) => calls.push(p.name));
    unsubscribe();
    const countBefore = calls.length;
    saveProfile({ name: "Third" });
    expect(calls.length).toBe(countBefore);
  });
});

describe("encodePlayerIdentity / decodePlayerIdentity", () => {
  it("encodes and decodes a profile without losing data", () => {
    const profile = { name: "Viktor", colorIndex: 3, avatarId: "avatar_2" };
    const encoded = encodePlayerIdentity(profile);
    const decoded = decodePlayerIdentity(encoded, "0");
    expect(decoded.name).toBe("Viktor");
    expect(decoded.colorIndex).toBe(3);
    expect(decoded.avatarId).toBe("avatar_2");
    expect(decoded.isEncoded).toBe(true);
  });

  it("truncates names longer than 20 characters when encoding", () => {
    const encoded = encodePlayerIdentity({ name: "A".repeat(30), colorIndex: 0 });
    const decoded = decodePlayerIdentity(encoded, "0");
    expect(decoded.name.length).toBe(20);
  });

  it("decodePlayerIdentity handles a plain (non-encoded) string as a name", () => {
    const decoded = decodePlayerIdentity("PlainName", "1");
    expect(decoded.name).toBe("PlainName");
    expect(decoded.isEncoded).toBe(false);
  });

  it("decodePlayerIdentity falls back to a name based on seatId when none is given", () => {
    const decoded = decodePlayerIdentity("", "2");
    expect(decoded.name).toBe("Player 2");
    expect(decoded.isEncoded).toBe(false);
  });

  it("gives a consistent colorIndex based on seatId when no color is encoded", () => {
    const decoded = decodePlayerIdentity("", "1");
    expect(decoded.colorIndex).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(decoded.colorIndex)).toBe(true);
  });
});
