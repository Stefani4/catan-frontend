const SESSION_KEY = "catan_match_session";

export function saveMatchSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    //ignore
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
    //ignore
  }
}
