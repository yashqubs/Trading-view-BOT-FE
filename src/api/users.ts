import { api } from './axios'
import type { Role, User } from '@/types'

export function listUsers() {
  return api.get<User[]>('/users').then((r) => r.data)
}

export interface CreateUserInput {
  name: string
  email: string
  role: Role
}

export interface CreateUserResponse {
  user: User
  tempPassword: string
}

export function createUser(input: CreateUserInput) {
  return api.post<CreateUserResponse>('/users', input).then((r) => r.data)
}

export interface UpdateUserInput {
  name?: string
  role?: Role
  active?: boolean
}

export function updateUser(id: string, input: UpdateUserInput) {
  return api.patch<User>(`/users/${id}`, input).then((r) => r.data)
}

export function resetUserPassword(id: string) {
  return api.post<{ tempPassword: string }>(`/users/${id}/reset-password`).then((r) => r.data)
}

export function deactivateUser(id: string) {
  return api.delete(`/users/${id}`).then((r) => r.data)
}
