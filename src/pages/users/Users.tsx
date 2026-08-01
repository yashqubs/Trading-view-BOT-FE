import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, KeyRound, Search, ShieldCheck, UserCheck, UserX, X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { SortableHeader, toggleSort, type SortConfig } from '@/components/common/SortableHeader'
import { Pagination } from '@/components/common/Pagination'
import { CreateUserModal } from './components/CreateUserModal'
import { useDeactivateUser, useResetUserPassword, useUpdateUser, useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/format'
import { useTimezone } from '@/context/TimezoneContext'

type SortKey = 'name' | 'email' | 'active' | 'lastLoginAt' | 'createdAt'

export function Users() {
  // See TimezoneContext — the "last login" column formats a timestamp.
  useTimezone()
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useUsers()
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()
  const resetPassword = useResetUserPassword()
  const [resetResult, setResetResult] = useState<{ id: string; name: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  // Newest-added first by default so a user you just created is easy to find.
  const [sort, setSort] = useState<SortConfig<SortKey>>({ by: 'createdAt', order: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const hasFilters = !!search || statusFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setStatusFilter('ALL')
  }

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const term = search.trim().toLowerCase()

    const filtered = users.filter((u) => {
      if (term && !u.name.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false
      if (statusFilter === 'ACTIVE' && !u.active) return false
      if (statusFilter === 'INACTIVE' && u.active) return false
      return true
    })

    const dir = sort.order === 'asc' ? 1 : -1
    return filtered.slice().sort((a, b) => {
      switch (sort.by) {
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'email':
          return a.email.localeCompare(b.email) * dir
        case 'active':
          return (Number(a.active) - Number(b.active)) * dir
        case 'lastLoginAt':
          return ((a.lastLoginAt ? Date.parse(a.lastLoginAt) : 0) - (b.lastLoginAt ? Date.parse(b.lastLoginAt) : 0)) * dir
        case 'createdAt':
          return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * dir
        default:
          return 0
      }
    })
  }, [users, search, statusFilter, sort])

  // Reset to page 1 when filters, sort, or page size change.
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, sort, pageSize])

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(key: SortKey) {
    setSort((s) => toggleSort(s, key))
  }

  // The backend resends the same pending password if one is already
  // outstanding, only minting a new one when the user already has their own
  // — so this is safe to click repeatedly without invalidating whatever was
  // already sent or shown before.
  async function handleResetPassword(id: string, name: string) {
    try {
      const { tempPassword } = await resetPassword.mutateAsync(id)
      setResetResult({ id, name, password: tempPassword })
      toast.success(`Password sent to ${name}`)
    } catch {
      toast.error('Could not send password')
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

        {!isLoading && !!users?.length && (
          <Card className="animate-fade-slide-in">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    placeholder="Name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 pb-2 text-xs text-text-tertiary transition-colors hover:text-danger"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </Card>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : !users?.length ? (
          <EmptyState title="No users yet" description="Add your first portal user to get started." />
        ) : !filteredUsers.length ? (
          <EmptyState
            title="No users match your filters"
            description="Try a different search term or clear the filters."
            action={
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
          <Card className="p-0 animate-fade-slide-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="name" current={sort} onSort={handleSort}>Name</SortableHeader>
                  <SortableHeader sortKey="email" current={sort} onSort={handleSort}>Email</SortableHeader>
                  <SortableHeader sortKey="active" current={sort} onSort={handleSort}>Status</SortableHeader>
                  <TableHead>2FA</TableHead>
                  <SortableHeader sortKey="lastLoginAt" current={sort} onSort={handleSort}>Last login</SortableHeader>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-text-secondary">{u.email}</TableCell>
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
                          {/* Own account: the user has "Forgot password?" on the login
                              page for this now — an admin resetting their own password
                              from here would be redundant. Reset stays available for
                              other users (locked-out colleagues, resending an invite). */}
                          {!isSelf && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={
                                    u.mustChangePassword
                                      ? `Resend password for ${u.name}`
                                      : `Reset password for ${u.name}`
                                  }
                                  onClick={() => handleResetPassword(u.id, u.name)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              {/* A password is already pending (they haven't set their own yet) — this
                                  resends that exact same one. Otherwise it mints a genuine new one. */}
                              <TooltipContent>{u.mustChangePassword ? 'Resend password' : 'Reset password'}</TooltipContent>
                            </Tooltip>
                          )}

                          {!u.active ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Activate ${u.name}`}
                                  onClick={async () => {
                                    await updateUser.mutateAsync({ id: u.id, input: { active: true } })
                                    toast.success(`${u.name} activated`)
                                  }}
                                >
                                  <UserCheck className="h-4 w-4 text-success" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Activate</TooltipContent>
                            </Tooltip>
                          ) : isSelf ? (
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
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredUsers.length}
            itemLabel="user"
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          </>
        )}

        <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle>Password sent</DialogTitle>
                  <DialogDescription className="mt-0.5">
                    for {resetResult?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <p className="text-sm text-text-secondary">
              An email with this temporary password has been sent to {resetResult?.name}. It&apos;s shown here too
              as a fallback in case delivery fails — it won&apos;t be shown again after you close this dialog.
              They&apos;ll be asked to set their own on next sign-in. Clicking this action again will resend this
              same password, not generate a new one.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3 shadow-[var(--shadow-sm)]">
              <span className="font-mono text-base tracking-wide text-text-primary">{resetResult?.password}</span>
              <Button variant="secondary" size="sm" onClick={copyResetPassword} aria-label="Copy password">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="primary" onClick={() => setResetResult(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
