import { api } from './axios'
import type { User } from '@/types'

export interface LoginResponse {
  requires2fa: boolean
  /** @deprecated Backend may still send this until email 2FA migration is complete */
  requiresSetup2fa?: boolean
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

export interface TwoFactorSetup {
  message: string
  maskedEmail?: string
}

export function setupTwoFactor() {
  return api.post<TwoFactorSetup>('/auth/2fa/setup').then((r) => r.data)
}

export function resendTwoFactorSetupCode() {
  return api.post<{ message: string }>('/auth/2fa/resend').then((r) => r.data)
}

export function verifyTwoFactor(code: string) {
  return api.post<{ user: User }>('/auth/2fa/verify', { code }).then((r) => r.data)
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

export function getMe() {
  return api.get<User>('/auth/me').then((r) => r.data)
}

export function changeOwnPassword(currentPassword: string, newPassword: string) {
  return api.patch('/users/me/password', { currentPassword, newPassword }).then((r) => r.data)
}
