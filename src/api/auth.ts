import { api } from './axios'
import type { User } from '@/types'

export interface LoginResponse {
  requiresPasswordChange: boolean
  requires2fa: boolean
  user?: User
  message?: string
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data)
}

export function loginWithTwoFactor(email: string, password: string, code: string) {
  return api.post<{ user: User }>('/auth/login/2fa', { email, password, code }).then((r) => r.data)
}

export function resendLoginTwoFactorCode(email: string, password: string) {
  return api
    .post<{ message: string }>('/auth/login/2fa/resend', { email, password })
    .then((r) => r.data)
}

export function forgotPassword(email: string) {
  return api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data)
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return api
    .post<{ message: string }>('/auth/reset-password', { email, code, newPassword })
    .then((r) => r.data)
}

export function enableTwoFactor() {
  return api.post<{ user: User }>('/auth/2fa/enable').then((r) => r.data)
}

export function skipTwoFactor() {
  return api.post<{ user: User }>('/auth/2fa/skip').then((r) => r.data)
}

export function disableTwoFactor() {
  return api.post<{ user: User }>('/auth/2fa/disable').then((r) => r.data)
}

export function logout() {
  return api.post('/auth/logout').then((r) => r.data)
}

export function getMe(options?: { sessionProbe?: boolean }) {
  return api.get<User>('/auth/me', options).then((r) => r.data)
}

export function changeOwnPassword(currentPassword: string, newPassword: string) {
  return api.patch('/users/me/password', { currentPassword, newPassword }).then((r) => r.data)
}
