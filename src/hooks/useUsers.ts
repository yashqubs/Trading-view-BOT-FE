import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  deactivateUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/api/users'
import type { User } from '@/types'

export function useUsers() {
  return useQuery<User[]>({ queryKey: ['users'], queryFn: listUsers })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useResetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    // Keeps the resend-vs-reset tooltip label accurate: a genuine reset flips
    // mustChangePassword to true, which the row's label depends on.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
