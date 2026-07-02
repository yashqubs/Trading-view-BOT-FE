import { useEffect, useRef } from 'react'
import { socket } from '@/lib/socket'

/**
 * Subscribes to a backend-pushed socket event for the component's lifetime.
 * Registers once per `event` (not per render) via a ref, so callers can pass
 * a fresh inline handler every render without re-subscribing.
 */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (payload: T) => handlerRef.current(payload)
    socket.on(event, listener)
    return () => {
      socket.off(event, listener)
    }
  }, [event])
}
