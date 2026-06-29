import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { Login } from '@/pages/login/Login'
import { Setup2FA } from '@/pages/login/Setup2FA'
import { ChangePassword } from '@/pages/login/ChangePassword'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { Stocks } from '@/pages/stocks/Stocks'
import { StockDetail } from '@/pages/stocks/StockDetail'
import { Trades } from '@/pages/trades/Trades'
import { Conditions } from '@/pages/conditions/Conditions'
import { Users } from '@/pages/users/Users'
import { Settings } from '@/pages/settings/Settings'
import { RouteError } from '@/pages/error/RouteError'

export const router = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      { path: '/setup-2fa', element: <Setup2FA /> },
      { path: '/change-password', element: <ChangePassword /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/stocks', element: <Stocks /> },
          { path: '/stocks/:ticker', element: <StockDetail /> },
          { path: '/trades', element: <Trades /> },
          { path: '/conditions', element: <Conditions /> },
          { path: '/settings', element: <Settings /> },
          {
            element: <RoleRoute allow={['ADMIN']} />,
            children: [{ path: '/users', element: <Users /> }],
          },
        ],
      },
    ],
  },
])
