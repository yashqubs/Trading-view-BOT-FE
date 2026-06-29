import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/context/ThemeContext'

export function Toaster() {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      expand
      richColors={false}
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          lineHeight: '1.5',
        },
      }}
    />
  )
}
