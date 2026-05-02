import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, Link2, Plus, ShieldCheck, Sparkles, Unlink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useUnlinkCytovaIdentity } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { LinkCytovaIdentityDialog } from './LinkCytovaIdentityDialog'
import type { PatientDetail } from '../types'

interface Props {
  patient: PatientDetail
}

/**
 * Read-side surface for the lab → global Cytova patient-identity link
 * (Phase E). Pairs with the existing ``PortalAccountCard`` in the
 * Patient Detail right column — the two cards cover different
 * concerns:
 *
 *   - ``PortalAccountCard``   → legacy in-tenant portal account
 *   - ``CytovaIdentityCard``  → link to a global Cytova account
 *                                (verified once, reused by Notify
 *                                Cytova in Phase F).
 *
 * Two states:
 *   - **Linked** → emerald "Cytova linked" badge, Cytova ID, verified
 *     date + actor, Unlink CTA (with confirmation modal).
 *   - **Unlinked** → muted helper copy + "Add Cytova identity" CTA
 *     opening the link dialog.
 *
 * Permission gate: same ``PATIENTS_MANAGE_PORTAL`` constant the
 * portal-account card uses. The backend ultimately gates link/unlink
 * on ``IsReceptionistOrLabAdmin``; this UI gate is a usability hint
 * to hide affordances the operator can't actually use.
 */
export function CytovaIdentityCard({ patient }: Props) {
  const [showLink, setShowLink] = useState(false)
  const [showUnlink, setShowUnlink] = useState(false)
  const unlinkMut = useUnlinkCytovaIdentity(patient.id)

  async function handleUnlink() {
    try {
      await unlinkMut.mutateAsync()
      toast.success('Cytova identity unlinked.')
      setShowUnlink(false)
    } catch {
      toast.error('Could not unlink the Cytova identity. Please try again.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          Cytova identity
        </CardTitle>
        {!patient.has_cytova_identity && (
          <Can permission={P.PATIENTS_MANAGE_PORTAL}>
            <Button
              size="sm" variant="outline" className="gap-1.5"
              onClick={() => setShowLink(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cytova identity
            </Button>
          </Can>
        )}
      </CardHeader>

      <CardContent>
        {patient.has_cytova_identity ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                Cytova linked
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cytova ID</span>
              <span className="font-mono text-xs">{patient.cytova_patient_id}</span>
            </div>

            {patient.cytova_identity_verified_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
                <span>{formatDateTime(patient.cytova_identity_verified_at)}</span>
              </div>
            )}

            {patient.cytova_identity_verified_by_display && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">By</span>
                <span>{patient.cytova_identity_verified_by_display}</span>
              </div>
            )}

            <Can permission={P.PATIENTS_MANAGE_PORTAL}>
              <div className="pt-2">
                <Button
                  variant="outline" size="sm"
                  className="w-full gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setShowUnlink(true)}
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Unlink Cytova identity
                </Button>
              </div>
            </Can>
          </div>
        ) : (
          <div className="py-2 text-center">
            <Link2 className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Not linked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Link this patient to their Cytova account to share results
              directly into their Cytova space.
            </p>
          </div>
        )}
      </CardContent>

      {/* Link form — only mounted when needed; the dialog manages its
          own form state and re-prefills on each open. */}
      <LinkCytovaIdentityDialog
        open={showLink}
        onOpenChange={setShowLink}
        patient={patient}
      />

      <ConfirmDialog
        open={showUnlink}
        onOpenChange={setShowUnlink}
        title="Unlink Cytova identity?"
        description={
          'The patient will no longer be linked to their Cytova account. '
          + 'Notify Cytova will be unavailable until you re-link them. '
          + 'Existing shared results stay accessible from the patient '
          + "'s Cytova space."
        }
        confirmLabel="Unlink"
        variant="destructive"
        onConfirm={handleUnlink}
        isLoading={unlinkMut.isPending}
      />
    </Card>
  )
}
