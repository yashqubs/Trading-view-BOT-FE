import { useRouteError } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm animate-fade-slide-in text-center">
        <p className="text-lg font-medium text-text-primary">Something went wrong</p>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <Button className="mt-5 w-full" onClick={() => window.location.assign('/')}>
          Back to dashboard
        </Button>
      </Card>
    </div>
  )
}
