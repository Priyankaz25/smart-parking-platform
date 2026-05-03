const SESSION_KEY = "parknest_session";

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  const value = localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
