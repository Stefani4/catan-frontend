import { describe, it, expect, beforeEach } from "vitest";
import { saveMatchSession, loadMatchSession, clearMatchSession } from "../matchSession.js";

beforeEach(() => {
  sessionStorage.clear();
});

describe("matchSession", () => {
  it("returns null when there is no saved session", () => {
    expect(loadMatchSession()).toBeNull();
  });

  it("saves and loads matchID/playerID/credentials", () => {
    const session = { matchID: "abc123", playerID: "1", credentials: "secret-token" };
    saveMatchSession(session);
    expect(loadMatchSession()).toEqual(session);
  });

  it("clearMatchSession removes the session", () => {
    saveMatchSession({ matchID: "abc123", playerID: "0" });
    clearMatchSession();
    expect(loadMatchSession()).toBeNull();
  });

  it("does not throw when sessionStorage contains broken JSON", () => {
    sessionStorage.setItem("catan_match_session", "{invalid");
    expect(() => loadMatchSession()).not.toThrow();
    expect(loadMatchSession()).toBeNull();
  });
});
