import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Edit, Ban, Building2, CreditCard, Mail, Phone, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { PartnerForm } from '../components/PartnerForm'
import { PartnerExamPricesSection } from '../components/PartnerExamPricesSection'
import { usePartner, useUpdatePartner, useDeactivatePartner } from '../api'
import { formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: partner, isLoading, error, refetch } = usePartner(id!)
  const updateMut = useUpdatePartner(id!)
  const deactivateMut = useDeactivatePartner(id!)
  const [editing, setEditing] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />
  if (isLoading || !partner) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>

  async function handleUpdate(data: Record<string, unknown>) {
    await updateMut.mutateAsync(data)
    toast.success('Partner updated.')
    setEditing(false)
  }

  async function handleDeactivate() {
    try {
      await deactivateMut.mutateAsync()
      toast.success('Partner deactivated.')
      setShowDeactivate(false)
    } catch { toast.error('Failed to deactivate.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={partner.name}
        breadcrumbs={[{ label: 'Partners', href: ROUTES.PARTNERS }, { label: partner.name }]}
      >
        {!editing && (
          <>
            <Can permission={P.PARTNERS_MANAGE}>
              <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /> Edit</Button>
            </Can>
            <Can permission={P.PARTNERS_MANAGE}>
              {partner.is_active && (
                <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}><Ban className="h-4 w-4" /> Deactivate</Button>
              )}
            </Can>
          </>
        )}
      </PageHeader>

      {editing ? (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle className="text-lg">Edit Partner</CardTitle></CardHeader>
          <CardContent>
            <PartnerForm
              mode="edit"
              defaultValues={{
                name: partner.name, organization_type: partner.organization_type,
                contact_person: partner.contact_person, phone: partner.phone,
                email: partner.email, address: partner.address,
                default_billing_mode: partner.default_billing_mode ?? '',
                payment_terms_days: partner.payment_terms_days ? String(partner.payment_terms_days) : '',
                billing_notes: partner.billing_notes, notes: partner.notes,
              }}
              onSubmit={handleUpdate} onCancel={() => setEditing(false)} isSubmitting={updateMut.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-muted-foreground" /> Organization</CardTitle>
                <Badge variant="outline" className={partner.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                  {partner.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code" value={partner.code} mono />
                <Field label="Type" value={partner.organization_type} />
              </div>
              <Separator />
              <div className="space-y-2">
                {partner.contact_person && <div className="flex items-center gap-2 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{partner.contact_person}</div>}
                {partner.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{partner.phone}</div>}
                {partner.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{partner.email}</div>}
                {partner.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{partner.address}</div>}
              </div>
              {partner.notes && <><Separator /><Field label="Notes" value={partner.notes} /></>}
              <div className="text-xs text-muted-foreground pt-2">Created {formatDateTime(partner.created_at)} &middot; Updated {formatDateTime(partner.updated_at)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-muted-foreground" /> Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Default mode</span><span className="font-medium">{partner.default_billing_mode || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment terms</span><span className="font-medium">{partner.payment_terms_days ? `${partner.payment_terms_days} days` : '—'}</span></div>
              {partner.billing_notes && <><Separator /><p className="text-xs bg-muted p-2 rounded">{partner.billing_notes}</p></>}
            </CardContent>
          </Card>
        </div>
      )}

      {/*
        Agreed-price management is rendered below the identity/billing
        cards and only in the read view — inline edit mode is already
        quite tall, and agreed prices are a separate reference concept
        that should not compete with the partner form for focus.
      */}
      {!editing && <PartnerExamPricesSection partnerId={partner.id} />}

      <ConfirmDialog open={showDeactivate} onOpenChange={setShowDeactivate} title="Deactivate partner"
        description={`"${partner.name}" will be hidden from new requests. Existing requests are not affected.`}
        confirmLabel="Deactivate" variant="destructive" onConfirm={handleDeactivate} isLoading={deactivateMut.isPending}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p></div>
}
