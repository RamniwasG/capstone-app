export function parseJwt(token) {
  if (!token) return null;
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token) {
  const data = parseJwt(token);
  if (!data || !data.exp) return false; // can't determine
  const now = Math.floor(Date.now() / 1000);
  return data.exp <= now;
}

export function logoutLocal() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (e) {
    // ignore
  }
  // redirect to sign-in
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function getToken() {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    return null;
  }
}
