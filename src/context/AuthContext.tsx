import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getMe, logout as apiLogout } from '@/api/auth'
import { registerUnauthorizedHandler } from '@/api/axios'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Restore an existing session on load. Flagged as a probe so a 401 — the
  // normal answer whenever the session has lapsed — resolves to "logged out"
  // and lets ProtectedRoute route to /login, instead of the Axios interceptor
  // force-reloading the page out from under a boot that hasn't finished.
  useEffect(() => {
    getMe({ sessionProbe: true })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null)
      queryClient.clear()
    })
  }, [queryClient])

  // The socket authenticates with the same httpOnly cookie the REST API
  // uses, so it only makes sense to hold a connection open while there's an
  // actual logged-in user — connect the moment we have one, disconnect the
  // moment we don't (logout, 401, or failed session restore on load).
  useEffect(() => {
    if (user) {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }, [user])

  async function logout() {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      queryClient.clear()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
