import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Minus, Trash2, Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/shared/FormField'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useUserPermissions, useManagePermission, usePermissionsCatalog } from '../api'
import type { PermissionOverride } from '../types'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
}

export function PermissionPanel({ userId }: Props) {
  const { data: perms, isLoading } = useUserPermissions(userId)
  const { data: catalog } = usePermissionsCatalog()
  const manageMut = useManagePermission(userId)
  const [showAdd, setShowAdd] = useState(false)
  const [addAction, setAddAction] = useState<'grant' | 'revoke'>('grant')
  const [addCode, setAddCode] = useState('')
  const [addReason, setAddReason] = useState('')

  async function handleAddOverride() {
    if (!addCode) return
    try {
      await manageMut.mutateAsync({ action: addAction, permission_code: addCode, reason: addReason })
      toast.success(`Permission ${addAction === 'grant' ? 'granted' : 'revoked'}.`)
      setShowAdd(false)
      setAddCode('')
      setAddReason('')
    } catch { toast.error('Failed.') }
  }

  async function handleRemoveOverride(code: string) {
    try {
      await manageMut.mutateAsync({ action: 'remove', permission_code: code })
      toast.success('Override removed.')
    } catch { toast.error('Failed.') }
  }

  if (isLoading || !perms) {
    return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading permissions...</CardContent></Card>
  }

  // Build flat catalog for select
  const allPermissions: { code: string; description: string }[] = []
  if (catalog) {
    for (const [, permsArr] of Object.entries(catalog)) {
      for (const p of permsArr) allPermissions.push(p)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-muted-foreground" /> Permissions
        </CardTitle>
        <Can permission={P.USERS_MANAGE_PERMISSIONS}>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /> Override
          </Button>
        </Can>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Effective count */}
        <div className="text-sm">
          <span className="text-muted-foreground">Effective permissions: </span>
          <span className="font-semibold">{perms.effective_permissions.length}</span>
          <span className="text-muted-foreground"> (from role: {perms.role_permissions.length})</span>
        </div>

        {/* Overrides */}
        {perms.overrides.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Overrides</p>
            {perms.overrides.map((o: PermissionOverride) => (
              <div key={o.id} className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                o.override_type === 'GRANT' ? 'bg-emerald-50' : 'bg-red-50',
              )}>
                <div className="flex items-center gap-2">
                  {o.override_type === 'GRANT' ? (
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-red-600" />
                  )}
                  <code className="text-xs">{o.permission_code}</code>
                  {o.reason && <span className="text-xs text-muted-foreground">— {o.reason}</span>}
                </div>
                <Can permission={P.USERS_MANAGE_PERMISSIONS}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveOverride(o.permission_code)}
                    disabled={manageMut.isPending}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Can>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Full effective list (collapsed) */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            View all {perms.effective_permissions.length} effective permissions
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {perms.effective_permissions.map((code: string) => (
              <Badge key={code} variant="outline" className="text-[10px] font-mono">{code}</Badge>
            ))}
          </div>
        </details>
      </CardContent>

      {/* Add override dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission Override</DialogTitle>
            <DialogDescription>Grant or revoke a specific permission for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Action" htmlFor="ov-action">
              <Select value={addAction} onValueChange={(v) => { if (v) setAddAction(v as 'grant' | 'revoke') }}>
                <SelectTrigger id="ov-action"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant (add permission)</SelectItem>
                  <SelectItem value="revoke">Revoke (remove permission)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Permission" htmlFor="ov-code" required>
              <Select value={addCode} onValueChange={(v) => setAddCode(v ?? '')}>
                <SelectTrigger id="ov-code"><SelectValue placeholder="Select permission" /></SelectTrigger>
                <SelectContent>
                  {allPermissions.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      <span className="font-mono text-xs">{p.code}</span>
                      <span className="ml-2 text-muted-foreground text-xs">— {p.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Reason" htmlFor="ov-reason" hint="Explain why this override is needed.">
              <Input id="ov-reason" value={addReason} onChange={(e) => setAddReason(e.target.value)} placeholder="e.g. Temporary for training" />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddOverride} disabled={!addCode || manageMut.isPending}>
              {manageMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {addAction === 'grant' ? 'Grant' : 'Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
