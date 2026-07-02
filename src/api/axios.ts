import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true,
})

let onUnauthorized: (() => void) | null = null

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

const CSRF_PROTECTED_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Double-submit CSRF: the backend's csrf_token cookie is deliberately not
// httpOnly so this can read it and echo it back as a header — see
// CsrfGuard on the backend for what this is defending against.
api.interceptors.request.use((config) => {
  if (config.method && CSRF_PROTECTED_METHODS.has(config.method)) {
    const csrfToken = readCookie('csrf_token')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
