// Keeps the active match session (matchID/seat/credentials/screen) around
// across a page reload. Without this, reloading mid-game re-runs the join
// flow from scratch, which the server rejects (the seat is already taken —
// see MatchLoader.jsx's mount effect), and the player gets bounced back to
// the Main Menu even though the match is still alive on the server.

const SESSION_KEY = "catan_match_session";

export function saveMatchSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable (private browsing, quota, etc.) — reload
    // resilience is best-effort, not required for the app to function.
  }
}

export function loadMatchSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMatchSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
