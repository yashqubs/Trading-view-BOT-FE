import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
  withCredentials: true,
});

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const CSRF_PROTECTED_METHODS = new Set(["post", "put", "patch", "delete"]);

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Double-submit CSRF: the backend's csrf_token cookie is deliberately not
// httpOnly so this can read it and echo it back as a header — see
// CsrfGuard on the backend for what this is defending against.
api.interceptors.request.use((config) => {
  if (config.method && CSRF_PROTECTED_METHODS.has(config.method)) {
    const csrfToken = readCookie("csrf_token");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

// A 401 on any of these means "wrong credentials" or "no session to refresh
// yet" — not "my session expired" — so a silent-refresh retry would be
// pointless (or, for /auth/refresh itself, an infinite loop).
const NO_REFRESH_RETRY_PATHS = ["/auth/login", "/auth/refresh"];

function shouldAttemptRefresh(url: string | undefined): boolean {
  return !!url && !NO_REFRESH_RETRY_PATHS.some((path) => url.includes(path));
}

// Shared across concurrent 401s so a burst of requests failing at once (the
// access token expiring mid-page) triggers exactly one refresh, not one per
// request — the refresh token rotates on use, so a second concurrent call
// would just invalidate the first one's new token.
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retriedAfterRefresh?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retriedAfterRefresh &&
      shouldAttemptRefresh(originalRequest.url)
    ) {
      originalRequest._retriedAfterRefresh = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        // Refresh failed — but that's not always session death. Refresh
        // tokens are single-use, so when another tab wins the rotation race
        // this tab's refresh 401s even though the winner already put fresh
        // cookies in the shared jar. Retry the original request once with
        // whatever cookies exist now; if it still 401s, its own pass through
        // this interceptor skips refresh (_retriedAfterRefresh) and lands in
        // the logout branch below.
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      onUnauthorized?.();
      // Belt-and-braces: clearing the user in AuthContext should make
      // ProtectedRoute redirect reactively, but don't rely solely on that
      // propagating through React's render cycle. A stale/expired session
      // must never leave the user stuck looking at a broken authenticated
      // page — force it.
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
