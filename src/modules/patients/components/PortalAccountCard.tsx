import { useState } from 'react'
import { toast } from 'sonner'
import { Globe, Trash2, Plus } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/shared/FormField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useCreatePortalAccount, useDeletePortalAccount } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import type { PortalAccount } from '../types'

interface Props {
  patientId: string
  patientEmail: string
  portalAccount: PortalAccount | null
}

export function PortalAccountCard({ patientId, patientEmail, portalAccount }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [email, setEmail] = useState(patientEmail || '')

  const createMut = useCreatePortalAccount(patientId)
  const deleteMut = useDeletePortalAccount(patientId)

  async function handleCreate() {
    if (!email) return
    try {
      await createMut.mutateAsync(email)
      toast.success('Portal account created. A temporary password has been generated.')
      setShowCreate(false)
    } catch {
      toast.error('Failed to create portal account.')
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync()
      toast.success('Portal account removed.')
      setShowDelete(false)
    } catch {
      toast.error('Failed to remove portal account.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Patient Portal
        </CardTitle>
        {!portalAccount && (
          <Can permission={P.PATIENTS_MANAGE_PORTAL}>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create Account
            </Button>
          </Can>
        )}
      </CardHeader>
      <CardContent>
        {portalAccount ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{portalAccount.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className={portalAccount.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-600'}
              >
                {portalAccount.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(portalAccount.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last login</span>
              <span>{portalAccount.last_login ? formatDateTime(portalAccount.last_login) : 'Never'}</span>
            </div>

            <Can permission={P.PATIENTS_MANAGE_PORTAL}>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Portal Account
                </Button>
              </div>
            </Can>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No portal account. Create one to give this patient access to their results.
          </p>
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create portal account</DialogTitle>
            <DialogDescription>
              The patient will receive a temporary password to access their results online.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Portal email" htmlFor="portal-email" required hint="Where the temporary password will be sent.">
            <Input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@email.com"
            />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!email || createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Remove portal account"
        description="This will permanently delete the patient's portal access. They will no longer be able to view their results online."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </Card>
  )
}
