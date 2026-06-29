import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.mustChangePassword) {
    return location.pathname === '/change-password' ? (
      <Outlet />
    ) : (
      <Navigate to="/change-password" replace />
    )
  }

  if (location.pathname === '/change-password') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
