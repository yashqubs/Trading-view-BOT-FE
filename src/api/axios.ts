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
    /** Set by the response interceptor; guards against a CSRF-reset/retry loop. */
    _retriedAfterCsrfReset?: boolean;
    /**
     * Marks the last-resort `POST /auth/logout` that clearServerSession makes.
     * It runs *because* recovery has already failed, so the response
     * interceptor must not try to recover it in turn — that would recurse.
     */
    sessionTeardown?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
  withCredentials: true,
});

/**
 * Hands the cookie jar back to the server to be emptied.
 *
 * POST /auth/logout needs no session and no CSRF header, and always answers
 * 200 — it exists precisely to clean up a jar too broken to authenticate with
 * (see AuthController.logout). Nothing on the client can delete an httpOnly
 * cookie, so without this call a jar that has stopped working stays broken for
 * the full lifetime of whatever is stuck in it, and clearing cookies by hand is
 * the only way back in. That is the bug this exists to close: any time the app
 * concludes a session is unrecoverable, it asks the server to tear it down
 * rather than just forgetting about it locally.
 *
 * Best-effort by design — if it fails, the caller still proceeds to log out
 * locally, so this must never reject.
 */
export async function clearServerSession(): Promise<void> {
  try {
    // Bounded: callers await this before redirecting to /login, and a stalled
    // connection must not leave the user staring at a dead page.
    await api.post("/auth/logout", null, { sessionTeardown: true, timeout: 5000 });
  } catch {
    // Offline, or the server is down. Nothing better to do; the login page
    // will try again on mount.
  }
}

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

// Matched on the message so this doesn't also catch the other 403 the API
// throws — "finish setting up 2FA", which comes from a healthy session and is
// the caller's business, not a broken jar. Mirrors CSRF_ERROR_MESSAGE on the
// backend.
const CSRF_ERROR_MESSAGE = "Invalid or missing CSRF token";

function isCsrfRejection(error: { response?: { status?: number; data?: unknown } }): boolean {
  if (error.response?.status !== 403) return false;
  const data = error.response.data as { message?: unknown } | undefined;
  return data?.message === CSRF_ERROR_MESSAGE;
}

/**
 * The single exit taken whenever the session cannot be recovered, from either
 * the 401 or the CSRF-403 path.
 *
 * Asking the server to tear the session down is the part that used to be
 * missing. Clearing React state is not enough: the cookies are httpOnly, so
 * whatever is left in the jar keeps going out on every later request —
 * including the ones the user makes trying to sign back in. A dead-but-present
 * refresh_token is the worst of them, because the backend reads it as "this
 * session is still recoverable" and so declines to evict the stale access
 * cookie sitting next to it. Nothing in the app broke that cycle, which is why
 * clearing cookies by hand was the only way back in.
 */
async function giveUp(
  originalRequest: { sessionProbe?: boolean },
  error: unknown,
): Promise<never> {
  await clearServerSession();
  onUnauthorized?.();

  // Only a session that died *under* the user warrants a hard navigation.
  // The app-load probe 401s on every cold visit, which is simply "not
  // logged in" — forcing a full page reload for that meant every return
  // visit after the session lapsed reloaded the page mid-boot before the
  // login form had rendered. AuthContext clears the user and ProtectedRoute
  // navigates to /login reactively, which is enough for the probe.
  if (!originalRequest.sessionProbe && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
  return Promise.reject(error);
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

    if (!originalRequest || originalRequest.sessionTeardown) {
      return Promise.reject(error);
    }

    // A CSRF rejection means the csrf_token cookie and the header no longer
    // agree, and the client cannot fix that on its own — it can neither read
    // the httpOnly half of the jar nor mint a replacement. Left alone it is
    // permanent: every state-changing request 403s identically until the cookie
    // expires. The backend now drops the access half on this exact response, so
    // one retry is enough to get back on the normal 401 -> silent-refresh path
    // and land a matched cookie/header pair.
    if (isCsrfRejection(error)) {
      if (!originalRequest._retriedAfterCsrfReset) {
        originalRequest._retriedAfterCsrfReset = true;
        return api(originalRequest);
      }
      // Still rejected after the server dropped the access half — the jar is
      // beyond repair from here. Fall through to the same teardown a dead
      // session gets, rather than leaving the app wedged on a 403 it can do
      // nothing about (which is what it used to do: 403s weren't handled at
      // all, so the portal just kept erroring until the user cleared cookies).
      return giveUp(originalRequest, error);
    }

    if (error.response?.status !== 401 || isNonSession401(originalRequest.url)) {
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
    return giveUp(originalRequest, error);
  },
);
