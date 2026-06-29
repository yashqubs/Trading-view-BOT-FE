import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, KeyRound, UserX } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { CreateUserModal } from './components/CreateUserModal'
import { useDeactivateUser, useResetUserPassword, useUpdateUser, useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/format'
import type { Role } from '@/types'

export function Users() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useUsers()
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()
  const resetPassword = useResetUserPassword()
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleRoleChange(id: string, role: Role) {
    try {
      await updateUser.mutateAsync({ id, input: { role } })
      toast.success('Role updated')
    } catch {
      toast.error('Could not update role')
    }
  }

  async function handleResetPassword(id: string, name: string) {
    try {
      const { tempPassword } = await resetPassword.mutateAsync(id)
      setResetResult({ name, password: tempPassword })
    } catch {
      toast.error('Could not reset password')
    }
  }

  function copyResetPassword() {
    if (!resetResult) return
    navigator.clipboard.writeText(resetResult.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-text-primary">Users</h1>
            <p className="text-sm text-text-secondary">Manage who can access the portal.</p>
          </div>
          <CreateUserModal />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !users?.length ? (
          <EmptyState title="No users yet" description="Add your first portal user to get started." />
        ) : (
          <Card className="p-0 animate-fade-slide-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const lastAdmin =
                    u.role === 'ADMIN' && users.filter((x) => x.role === 'ADMIN' && x.active).length <= 1

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-text-secondary">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(role) => handleRoleChange(u.id, role as Role)}
                          disabled={isSelf && lastAdmin}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.twoFactorEnabled ? 'accent' : 'neutral'}>
                          {u.twoFactorEnabled ? 'Enabled' : 'Off'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-tertiary">{formatDateTime(u.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Reset password for ${u.name}`}
                                onClick={() => handleResetPassword(u.id, u.name)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset password</TooltipContent>
                          </Tooltip>

                          {isSelf ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled aria-label="Cannot deactivate yourself">
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>You can&apos;t deactivate your own account</TooltipContent>
                            </Tooltip>
                          ) : (
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" aria-label={`Deactivate ${u.name}`}>
                                  <UserX className="h-4 w-4 text-danger" />
                                </Button>
                              }
                              title={`Deactivate ${u.name}?`}
                              description="They will no longer be able to log in. Trade history attribution is preserved."
                              confirmLabel="Deactivate"
                              onConfirm={async () => {
                                await deactivateUser.mutateAsync(u.id)
                                toast.success(`${u.name} deactivated`)
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {resetResult && (
          <Card className="fixed bottom-6 right-6 max-w-sm animate-fade-slide-in shadow-xl">
            <p className="text-sm font-medium text-text-primary">Password reset for {resetResult.name}</p>
            <p className="mt-1 text-xs text-text-secondary">Share this once — it won&apos;t be shown again.</p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="font-mono text-sm text-text-primary">{resetResult.password}</span>
              <Button variant="ghost" size="icon" onClick={copyResetPassword} aria-label="Copy password">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setResetResult(null)}>
              Close
            </Button>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
