import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { api, registerUnauthorizedHandler } from './axios'

// Regression cover for the "came back after a few days and couldn't get back in
// without clearing cookies" bug. The lockout itself was a backend problem, but
// the interceptor made the dead-session state look broken: a cold visit
// hard-reloaded the page mid-boot, and a lost refresh-rotation race logged
// every tab out.

type Reply = { status: number; data?: unknown }

const originalAdapter = api.defaults.adapter

const CSRF_403: Reply = { status: 403, data: { message: 'Invalid or missing CSRF token' } }

/** Every request the interceptor actually put on the wire, in order. */
const calls: string[] = []

/**
 * Stubs the transport rather than the network so the interceptor itself is
 * what's under test. `respond` sees each call in order, so a test can make the
 * same URL fail then succeed.
 */
function useTransport(respond: (method: string, url: string) => Reply) {
  calls.length = 0
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    calls.push(`${(config.method ?? 'get').toLowerCase()} ${config.url ?? ''}`)
    const { status, data } = respond((config.method ?? 'get').toLowerCase(), config.url ?? '')
    const response = {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    } as AxiosResponse

    if (status >= 200 && status < 300) return response
    throw new AxiosError('Request failed', String(status), config, null, response)
  }
}

describe('api response interceptor on 401', () => {
  let onUnauthorized: ReturnType<typeof vi.fn<() => void>>
  let assign: ReturnType<typeof vi.fn<(url: string) => void>>

  beforeEach(() => {
    onUnauthorized = vi.fn<() => void>()
    registerUnauthorizedHandler(onUnauthorized)

    assign = vi.fn<(url: string) => void>()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/stocks', assign },
    })
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('silently renews and retries when the refresh token is still good', async () => {
    let meCalls = 0
    useTransport((_method, url) => {
      if (url.includes('/auth/refresh')) return { status: 200, data: {} }
      return ++meCalls === 1 ? { status: 401 } : { status: 200, data: { id: 'u1' } }
    })

    await expect(api.get('/auth/me').then((r) => r.data)).resolves.toEqual({ id: 'u1' })
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('recovers without logging out when a sibling tab won the rotation race', async () => {
    // This tab's single-use refresh token 401s, but the winner already put
    // fresh cookies in the shared jar — so the plain retry succeeds.
    let tradeCalls = 0
    useTransport((_method, url) => {
      if (url.includes('/auth/refresh')) return { status: 401 }
      return ++tradeCalls === 1 ? { status: 401 } : { status: 200, data: [] }
    })

    await expect(api.get('/trades').then((r) => r.data)).resolves.toEqual([])
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('forces a redirect when a session dies under the user mid-page', async () => {
    useTransport(() => ({ status: 401 }))

    await expect(api.get('/trades')).rejects.toBeTruthy()
    expect(onUnauthorized).toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('does not reload the page when the app-load session probe finds no session', async () => {
    // A 401 here is the normal answer on any cold visit after the session
    // lapsed. Reloading mid-boot is what made returning to the portal look
    // like an error instead of a login screen — AuthContext clears the user
    // and ProtectedRoute routes to /login on its own.
    useTransport(() => ({ status: 401 }))

    await expect(api.get('/auth/me', { sessionProbe: true })).rejects.toBeTruthy()
    expect(onUnauthorized).toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('never redirects off a failed refresh on its own', async () => {
    useTransport(() => ({ status: 401 }))

    await expect(api.post('/auth/refresh')).rejects.toBeTruthy()
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('never redirects off a rejected login attempt', async () => {
    useTransport(() => ({ status: 401, data: { message: 'Invalid email or password' } }))

    await expect(api.post('/auth/login', { email: 'a@b.c', password: 'wrong' })).rejects.toBeTruthy()
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('hands the dead session back to the server instead of only forgetting it', async () => {
    // The heart of the "had to clear cookies to log back in" bug: the app used
    // to drop the user locally and leave the jar untouched. The cookies are
    // httpOnly, so they kept going out on every later request — including the
    // login attempts — and only the server can remove them.
    useTransport((_method, url) => (url.includes('/auth/logout') ? { status: 200 } : { status: 401 }))

    await expect(api.get('/trades')).rejects.toBeTruthy()
    expect(calls).toContain('post /auth/logout')
    expect(onUnauthorized).toHaveBeenCalled()
  })

  it('still logs out locally when the teardown call itself fails', async () => {
    // Offline, or the API is down. Best-effort: it must never swallow the
    // logout or wedge the app on a rejected cleanup.
    useTransport((_method, url) => (url.includes('/auth/logout') ? { status: 500 } : { status: 401 }))

    await expect(api.get('/trades')).rejects.toBeTruthy()
    expect(onUnauthorized).toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/login')
  })
})

describe('api response interceptor on a CSRF 403', () => {
  let onUnauthorized: ReturnType<typeof vi.fn<() => void>>
  let assign: ReturnType<typeof vi.fn<(url: string) => void>>

  beforeEach(() => {
    onUnauthorized = vi.fn<() => void>()
    registerUnauthorizedHandler(onUnauthorized)
    assign = vi.fn<(url: string) => void>()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/stocks', assign },
    })
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('retries once, because the backend drops the mismatched cookies on that 403', async () => {
    // The client can't repair a csrf cookie/header mismatch itself — it can
    // neither read the httpOnly half of the jar nor mint a replacement. The
    // 403 response clears the access half, so the retry lands on the normal
    // 401 -> refresh path and comes back with a matched pair.
    let ruleCalls = 0
    useTransport((_method, url) => {
      if (url.includes('/auth/refresh')) return { status: 200, data: {} }
      if (++ruleCalls === 1) return CSRF_403
      return ruleCalls === 2 ? { status: 401 } : { status: 200, data: { ok: true } }
    })

    await expect(api.patch('/rules', {}).then((r) => r.data)).resolves.toEqual({ ok: true })
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('tears the session down when the mismatch survives the retry', async () => {
    // Previously a 403 fell straight through: no refresh, no logout, no
    // redirect. The portal just kept erroring on every action with no way out.
    useTransport((_method, url) => (url.includes('/auth/logout') ? { status: 200 } : CSRF_403))

    await expect(api.patch('/rules', {})).rejects.toBeTruthy()
    expect(calls).toContain('post /auth/logout')
    expect(onUnauthorized).toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('leaves the pending-2FA 403 for the caller to handle', async () => {
    // Same status, healthy session. Tearing it down would break the very flow
    // the 403 is steering the user into.
    useTransport(() => ({
      status: 403,
      data: { message: 'Finish setting up 2FA and changing your password to continue' },
    }))

    await expect(api.patch('/rules', {})).rejects.toBeTruthy()
    expect(calls).toEqual(['patch /rules'])
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})
