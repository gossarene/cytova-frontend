import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { UserCog, Ban, CheckCircle2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { ROLE_LABELS, type TenantRole } from '@/lib/auth/types'
import { PermissionPanel } from '../components/PermissionPanel'
import { useUser, useDeactivateUser, useActivateUser, useAssignRole } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: user, isLoading, error, refetch } = useUser(id!)
  const deactivateMut = useDeactivateUser(id!)
  const activateMut = useActivateUser(id!)
  const assignRoleMut = useAssignRole(id!)

  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [newRole, setNewRole] = useState<string>('')

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !user) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  async function handleDeactivate() {
    try { await deactivateMut.mutateAsync(); toast.success('User deactivated.'); setShowDeactivate(false) }
    catch { toast.error('Failed. Cannot deactivate the last Lab Admin.') }
  }

  async function handleActivate() {
    try { await activateMut.mutateAsync(); toast.success('User reactivated.') }
    catch { toast.error('Failed.') }
  }

  async function handleRoleChange() {
    if (!newRole) return
    try {
      await assignRoleMut.mutateAsync(newRole as TenantRole)
      toast.success(`Role changed to ${ROLE_LABELS[newRole as TenantRole]}.`)
      setShowRoleChange(false)
    } catch { toast.error('Failed. Cannot remove the last Lab Admin.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.full_name}
        breadcrumbs={[{ label: 'Users', href: ROUTES.USERS }, { label: user.full_name }]}
      >
        <Can permission={P.USERS_ACTIVATE}>
          {!user.is_active && (
            <Button className="gap-2" onClick={handleActivate} disabled={activateMut.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Reactivate
            </Button>
          )}
        </Can>
        <Can permission={P.USERS_DEACTIVATE}>
          {user.is_active && (
            <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}>
              <Ban className="h-4 w-4" /> Deactivate
            </Button>
          )}
        </Can>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCog className="h-4 w-4 text-muted-foreground" /> User Profile
              </CardTitle>
              <Badge variant="outline" className={user.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" value={user.email} />
              <Field label="Full name" value={user.full_name} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-sm font-medium">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
              </div>
              <Can permission={P.USERS_ASSIGN_ROLE}>
                <Button variant="outline" size="sm" onClick={() => { setNewRole(user.role); setShowRoleChange(true) }}>
                  Change Role
                </Button>
              </Can>
            </div>
            {user.created_by && (
              <p className="text-xs text-muted-foreground">Created by {user.created_by.email}</p>
            )}
            <div className="text-xs text-muted-foreground">
              Joined {formatDateTime(user.created_at)} &middot; Updated {formatDateTime(user.updated_at)}
            </div>
          </CardContent>
        </Card>

        {/* Permissions panel */}
        <PermissionPanel userId={user.id} />
      </div>

      {/* Deactivate dialog */}
      <ConfirmDialog open={showDeactivate} onOpenChange={setShowDeactivate}
        title="Deactivate user" variant="destructive"
        description={`Deactivate "${user.full_name}"? They will lose access to the laboratory workspace.`}
        confirmLabel="Deactivate" onConfirm={handleDeactivate} isLoading={deactivateMut.isPending}
      />

      {/* Role change dialog */}
      <Dialog open={showRoleChange} onOpenChange={setShowRoleChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change user role</DialogTitle>
            <DialogDescription>
              Changing the role will update default permissions and clear any existing overrides.
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => { if (v) setNewRole(v) }}>
            <SelectTrigger><SelectValue placeholder="Select new role" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleChange(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={!newRole || assignRoleMut.isPending}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-sm">{value}</p></div>
}
