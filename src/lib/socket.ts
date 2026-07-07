import { io, type Socket } from "socket.io-client";

// VITE_API_BASE_URL includes a trailing /api for REST calls (see src/api/axios.ts),
// but socket.io-client treats any path in the URL as a namespace, not a route —
// and the backend gateway (@WebSocketGateway() with no arguments) lives on the
// default "/" namespace. Strip the /api suffix so this connects to that default
// namespace instead of a nonexistent "/api" one .
const SOCKET_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/api\/?$/, "");

// Created once at module load with autoConnect disabled, so hooks can always
// register listeners via `socket.on(...)` immediately — regardless of
// whether auth/connection has happened yet — instead of racing against
// AuthContext's connectSocket() call. Reuses the same httpOnly access_token
// cookie the REST API already relies on (withCredentials), so there's no
// separate socket login step.
export const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export function connectSocket(): void {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect();
}
