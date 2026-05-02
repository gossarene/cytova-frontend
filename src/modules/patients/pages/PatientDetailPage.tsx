import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Edit, UserX, FilePlus2, ClipboardList, ArrowRight, ChevronRight,
  FileText, Clock, CheckCircle2, XCircle, Users, Building2, CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Can } from '@/lib/permissions/Can'
import { usePermission } from '@/lib/permissions/hooks'
import { P } from '@/lib/permissions/constants'
import { PatientForm, type PatientFormData } from '../components/PatientForm'
import { PortalAccountCard } from '../components/PortalAccountCard'
import { CytovaIdentityCard } from '../components/CytovaIdentityCard'
import {
  usePatient, useUpdatePatient, useDeactivatePatient,
  usePatientRequests, usePatientRequestStats,
} from '../api'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { GENDER_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '../types'
import { ROUTES } from '@/config/routes'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: patient, isLoading, error, refetch } = usePatient(id!)
  const updateMut = useUpdatePatient(id!)
  const deactivateMut = useDeactivatePatient(id!)
  const { data: recentRequests, isLoading: requestsLoading } = usePatientRequests(id!)
  const { data: stats, isLoading: statsLoading } = usePatientRequestStats(id!)

  const canEditIdentity = usePermission(P.PATIENTS_UPDATE_IDENTITY)
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

  function navigateToNewRequest() {
    navigate(ROUTES.REQUEST_NEW, {
      state: {
        patientId: patient.id,
        patientName: patient.full_name,
        patientDocumentNumber: patient.document_number,
      },
    })
  }

  const docTypeLabel = DOCUMENT_TYPE_OPTIONS.find((d) => d.value === patient.document_type)?.label ?? patient.document_type
  const lastRequestDate = recentRequests?.[0]?.created_at

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={patient.full_name}
        breadcrumbs={[
          { label: 'Patients', href: ROUTES.PATIENTS },
          { label: patient.full_name },
        ]}
      >
        {!editing && (
          <>
            <Can permission={P.REQUESTS_CREATE}>
              <Button className="gap-2" onClick={navigateToNewRequest}>
                <FilePlus2 className="h-4 w-4" />
                New Request
              </Button>
            </Can>
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
              canEditIdentity={canEditIdentity}
              defaultValues={{
                document_type: patient.document_type,
                document_number: patient.document_number,
                first_name: patient.first_name,
                last_name: patient.last_name,
                date_of_birth: patient.date_of_birth,
                gender: patient.gender,
                nationality: patient.nationality,
                phone: patient.phone,
                email: patient.email,
                city_of_residence: patient.city_of_residence,
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
        <>
          {/* Patient info + sidebar */}
          <div className="grid gap-6 lg:grid-cols-3">
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
                  <Field label="Document Type" value={docTypeLabel} />
                  <Field label="Document Number" value={patient.document_number} mono />
                  <Field label="Gender" value={GENDER_OPTIONS.find((g) => g.value === patient.gender)?.label ?? patient.gender} />
                  <Field label="Date of Birth" value={formatDate(patient.date_of_birth)} />
                  <Field label="Nationality" value={patient.nationality || '\u2014'} />
                  <Field label="Insurance Number" value={patient.insurance_number || '\u2014'} />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" value={patient.phone || '\u2014'} />
                  <Field label="Email" value={patient.email || '\u2014'} />
                  <Field label="City of Residence" value={patient.city_of_residence || '\u2014'} />
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

            <div className="space-y-6">
              <PortalAccountCard
                patientId={patient.id}
                patientEmail={patient.email}
                portalAccount={patient.portal_account}
              />
              {/* Cytova identity link (Phase E) — paired with the
                  legacy PortalAccountCard. The two cards cover
                  different concerns: PortalAccountCard owns the
                  in-tenant local portal account; CytovaIdentityCard
                  owns the link to a global Cytova account. The
                  Cytova link is what Notify Cytova reuses (Phase F)
                  so the receptionist verifies identity once. */}
              <CytovaIdentityCard patient={patient} />
            </div>
          </div>

          {/* Analytics: KPIs + source breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Total Requests"
              value={stats?.total_requests}
              icon={FileText}
              loading={statsLoading}
            />
            <KpiCard
              label="Pending"
              value={stats ? (stats.requests_by_status?.DRAFT ?? 0) + (stats.requests_by_status?.CONFIRMED ?? 0) + (stats.requests_by_status?.IN_PROGRESS ?? 0) : undefined}
              icon={Clock}
              loading={statsLoading}
              accent="amber"
            />
            <KpiCard
              label="Completed"
              value={stats?.requests_by_status?.COMPLETED}
              icon={CheckCircle2}
              loading={statsLoading}
              accent="emerald"
            />
            <KpiCard
              label="Cancelled"
              value={stats?.requests_by_status?.CANCELLED}
              icon={XCircle}
              loading={statsLoading}
              accent="red"
            />
            {/* Last request date as contextual insight */}
            <KpiCard
              label="Last Request"
              displayValue={lastRequestDate ? formatDate(lastRequestDate) : '\u2014'}
              icon={CalendarClock}
              loading={requestsLoading}
            />
          </div>

          {/* Source breakdown pills */}
          {!statsLoading && stats && stats.total_requests > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">By source:</span>
              <SourcePill
                icon={Users}
                label="Direct"
                count={stats.requests_by_source?.DIRECT_PATIENT ?? 0}
                color="blue"
              />
              <SourcePill
                icon={Building2}
                label="Partner"
                count={stats.requests_by_source?.PARTNER_ORGANIZATION ?? 0}
                color="violet"
              />
            </div>
          )}

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Requests</CardTitle>
                <Can permission={P.REQUESTS_VIEW}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => navigate(`${ROUTES.REQUESTS}?patient_id=${patient.id}`)}
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-transparent px-3 py-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : !recentRequests || recentRequests.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No requests yet"
                  description="This patient has no analysis requests."
                />
              ) : (
                <div className="space-y-1">
                  {recentRequests.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-muted/40 text-left"
                      onClick={() => navigate(`/requests/${req.id}`)}
                    >
                      <span className="font-mono text-xs text-muted-foreground w-36 shrink-0 truncate">
                        {req.request_number}
                      </span>
                      <StatusBadge status={req.status} />
                      <Badge variant="outline" className="text-xs font-normal">
                        {req.items_count} exam{req.items_count !== 1 ? 's' : ''}
                      </Badge>
                      {req.source_type === 'PARTNER_ORGANIZATION' && (
                        <Badge variant="outline" className="text-xs font-normal border-violet-200 bg-violet-50 text-violet-600 max-w-[160px] truncate">
                          {req.partner_organization_name || 'Partner'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {formatDate(req.created_at)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 transition-colors group-hover:text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
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

// ---------------------------------------------------------------------------
// Private components
// ---------------------------------------------------------------------------

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

const ACCENT_CLASSES: Record<string, { icon: string; text: string }> = {
  amber:   { icon: 'text-amber-600 bg-amber-50',   text: 'text-amber-700' },
  emerald: { icon: 'text-emerald-600 bg-emerald-50', text: 'text-emerald-700' },
  red:     { icon: 'text-red-500 bg-red-50',       text: 'text-red-600' },
}

function KpiCard({
  label,
  value,
  displayValue,
  icon: Icon,
  loading,
  accent,
}: {
  label: string
  value?: number
  /** Override display with a string (e.g. formatted date) instead of a number */
  displayValue?: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  accent?: keyof typeof ACCENT_CLASSES
}) {
  const colors = accent ? ACCENT_CLASSES[accent] : undefined
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`rounded-lg p-2 ${colors?.icon ?? 'text-muted-foreground bg-muted'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-6 w-12" />
          ) : displayValue ? (
            <p className={`text-sm font-semibold truncate ${colors?.text ?? ''}`}>{displayValue}</p>
          ) : (
            <p className={`text-xl font-bold tabular-nums ${colors?.text ?? ''}`}>{value ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SourcePill({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  color: 'blue' | 'violet'
}) {
  const styles = color === 'blue'
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-violet-200 bg-violet-50 text-violet-700'

  return (
    <Badge variant="outline" className={`gap-1.5 font-normal text-xs py-0.5 ${styles}`}>
      <Icon className="h-3 w-3" />
      {label}
      <span className="font-semibold tabular-nums">{count}</span>
    </Badge>
  )
}
