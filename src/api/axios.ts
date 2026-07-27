import axios from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * Marks the one-off "am I already logged in?" call AuthContext makes on
     * app load. A 401 there is a normal answer on any cold visit, not a
     * session dying under the user, so it must not force a hard navigation —
     * see the response interceptor.
     */
    sessionProbe?: boolean;
    /** Set by the response interceptor; guards against a refresh/retry loop. */
    _retriedAfterRefresh?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
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

// A 401 from either of these is not, on its own, evidence that the session is
// dead — so neither gets a silent-refresh retry, and neither drives the
// logout/redirect below. The request that originally failed decides that.
//
//   /auth/login — "wrong credentials" or "no session yet". Retrying via
//     refresh would be pointless.
//   /auth/refresh — retrying it through itself would loop, and a 401 here is
//     routinely benign: refresh tokens are single-use, so a tab that loses the
//     rotation race 401s while the winner has already put fresh cookies in the
//     shared jar. Redirecting on that would log every tab out over a race the
//     retry below recovers from cleanly.
const NON_SESSION_401_PATHS = ["/auth/login", "/auth/refresh"];

function isNonSession401(url: string | undefined): boolean {
  return !!url && NON_SESSION_401_PATHS.some((path) => url.includes(path));
}

// Shared across concurrent 401s so a burst of requests failing at once (the
// access token expiring mid-page) triggers exactly one refresh, not one per
// request — the refresh token rotates on use, so a second concurrent call
// would just invalidate the first one's new token.
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isNonSession401(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (!originalRequest._retriedAfterRefresh) {
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
        // Refresh failed — but that's not always session death (see
        // NON_SESSION_401_PATHS on the rotation race). Retry the original
        // request once with whatever cookies exist now; if it still 401s, its
        // own pass through here skips refresh (_retriedAfterRefresh) and
        // lands in the logout branch below.
        return api(originalRequest);
      }
    }

    // Refresh has already been tried and the request still 401s: the session
    // really is gone.
    onUnauthorized?.();

    // Only a session that died *under* the user warrants a hard navigation.
    // The app-load probe 401s on every cold visit, which is simply "not
    // logged in" — forcing a full page reload for that meant every return
    // visit after the session lapsed reloaded the page mid-boot before the
    // login form had rendered. AuthContext clears the user and ProtectedRoute
    // navigates to /login reactively, which is enough for the probe.
    if (
      !originalRequest.sessionProbe &&
      window.location.pathname !== "/login"
    ) {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);
