import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { createMemoryRouter, Navigate, Outlet, useLocation } from 'react-router'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

// Smoke cover for the routing layer itself, added when react-router-dom@7 was
// replaced by react-router@8 (the v8 major removed the `-dom` package). Nothing
// else in the suite mounts a router, so without this a version bump could break
// every route and still ship green.
//
// What this does NOT cover, verified by deliberately breaking it: importing
// `RouterProvider` from 'react-router' instead of 'react-router/dom' passes all
// of these. The DOM build only differs by injecting React DOM's `flushSync`,
// which affects synchronous flushing (view transitions, scroll restoration) —
// not something jsdom meaningfully models. That import is load-bearing and
// type-identical, so it needs a human eye on it, not this file's false comfort.

vi.mock('@/api/auth', () => ({
  getMe: vi.fn(() => Promise.reject(new Error('401'))),
  logout: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/lib/socket', () => ({
  socket: { on: vi.fn(), off: vi.fn(), connected: false, connect: vi.fn(), disconnect: vi.fn() },
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}))

function LoginStub() {
  const location = useLocation()
  return (
    <div>
      <span>login page</span>
      <span data-testid="from">
        {(location.state as { from?: { pathname: string } })?.from?.pathname ?? 'none'}
      </span>
    </div>
  )
}

function renderAt(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginStub /> },
      { path: '/dashboard', element: <Navigate to="/" replace /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: (
              <div>
                <span>app shell</span>
                <Outlet />
              </div>
            ),
            children: [
              { path: '/', element: <span>dashboard page</span> },
              { path: '/stocks/:ticker', element: <span>stock detail</span> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('routing layer (react-router v8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts the router and renders a route element', async () => {
    renderAt('/login')
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('sends an unauthenticated visitor from a protected route to /login', async () => {
    // Also covers the session-probe contract: a rejected getMe on load must
    // resolve to "logged out" and let ProtectedRoute redirect reactively,
    // rather than the app hanging on its loading state.
    renderAt('/')
    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('preserves the attempted URL in location state so login can return there', async () => {
    renderAt('/stocks/AAPL')
    await screen.findByText('login page')
    expect(screen.getByTestId('from')).toHaveTextContent('/stocks/AAPL')
  })

  it('resolves a declarative <Navigate> redirect route', async () => {
    const router = renderAt('/dashboard')
    await waitFor(() => expect(router.state.location.pathname).not.toBe('/dashboard'))
    // Unauthenticated, so it lands on /login rather than /, but the point is
    // that the /dashboard → / redirect resolved rather than dead-ending.
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('navigates imperatively through the router', async () => {
    const router = renderAt('/login')
    await screen.findByText('login page')
    await router.navigate('/stocks/GOOG')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
