import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Edit, UserX } from 'lucide-react'
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
import { PatientForm, type PatientFormData } from '../components/PatientForm'
import { PortalAccountCard } from '../components/PortalAccountCard'
import { usePatient, useUpdatePatient, useDeactivatePatient } from '../api'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { ROUTES } from '@/config/routes'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading, error, refetch } = usePatient(id!)
  const updateMut = useUpdatePatient(id!)
  const deactivateMut = useDeactivatePatient(id!)

  const [editing, setEditing] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)

  if (error) return <ErrorState onRetry={refetch} />

  if (isLoading || !patient) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  async function handleUpdate(data: PatientFormData) {
    await updateMut.mutateAsync(data)
    toast.success('Patient updated successfully.')
    setEditing(false)
  }

  async function handleDeactivate() {
    try {
      await deactivateMut.mutateAsync()
      toast.success('Patient deactivated.')
      setShowDeactivate(false)
    } catch {
      toast.error('Failed to deactivate patient.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.full_name}
        breadcrumbs={[
          { label: 'Patients', href: ROUTES.PATIENTS },
          { label: patient.full_name },
        ]}
      >
        {!editing && (
          <>
            <Can permission={P.PATIENTS_UPDATE}>
              <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Can>
            <Can permission={P.PATIENTS_DEACTIVATE}>
              {patient.is_active && (
                <Button variant="destructive" className="gap-2" onClick={() => setShowDeactivate(true)}>
                  <UserX className="h-4 w-4" />
                  Deactivate
                </Button>
              )}
            </Can>
          </>
        )}
      </PageHeader>

      {editing ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Edit Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientForm
              mode="edit"
              defaultValues={{
                first_name: patient.first_name,
                last_name: patient.last_name,
                date_of_birth: patient.date_of_birth,
                gender: patient.gender,
                phone: patient.phone,
                email: patient.email,
                address: patient.address,
                insurance_number: patient.insurance_number,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
              isSubmitting={updateMut.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Patient Information</CardTitle>
                <Badge
                  variant="outline"
                  className={patient.is_active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-600'}
                >
                  {patient.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="National ID" value={patient.national_id} mono />
                <Field label="Gender" value={patient.gender} />
                <Field label="Date of Birth" value={formatDate(patient.date_of_birth)} />
                <Field label="Insurance Number" value={patient.insurance_number || '—'} />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" value={patient.phone || '—'} />
                <Field label="Email" value={patient.email || '—'} />
              </div>
              {patient.address && <Field label="Address" value={patient.address} />}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
                <div>
                  Created {formatDateTime(patient.created_at)}
                  {patient.created_by && ` by ${patient.created_by.email}`}
                </div>
                <div>Updated {formatDateTime(patient.updated_at)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <PortalAccountCard
              patientId={patient.id}
              patientEmail={patient.email}
              portalAccount={patient.portal_account}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeactivate}
        onOpenChange={setShowDeactivate}
        title="Deactivate patient"
        description={`This will mark "${patient.full_name}" as inactive. Their records will be preserved but they won't appear in active lists.`}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={deactivateMut.isPending}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
