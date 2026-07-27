import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// RouterProvider specifically must come from 'react-router/dom', not
// 'react-router' — the DOM build wraps the base provider with React DOM's
// flushSync, which the bare one has no way to obtain. Both type-check
// identically, so getting this wrong fails silently at runtime rather than at
// build time. Everything else in the app imports from 'react-router'; see the
// v8 migration note in README.md.
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { router } from '@/routes/router'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Toaster } from '@/components/ui/toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
})

async function enableMocking() {
  if (import.meta.env.VITE_MOCK !== 'true') return
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
