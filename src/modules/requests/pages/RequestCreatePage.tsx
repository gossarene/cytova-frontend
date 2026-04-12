import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Loader2, Plus, FlaskConical, ArrowRight, ArrowLeft, Check,
  User, Building2, Tag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RequestItemRow } from '../components/RequestItemRow'
import { useCreateRequest, usePricingPreview } from '../api'
import { usePatients } from '@/modules/patients/api'
import { useActivePartners } from '@/modules/partners/api'
import { useExamDefinitions } from '@/modules/catalog/api'
import { formatCurrency } from '@/lib/utils/currency'
import { ROUTES } from '@/config/routes'
import {
  SOURCE_TYPE_OPTIONS, BILLING_MODE_OPTIONS,
} from '../types'
import type {
  SourceType, RequestBillingMode, RequestItemInput,
  ResolvedItemPrice, PriceSource,
} from '../types'

interface ExamOption {
  id: string
  code: string
  name: string
  sample_type: string
  unit_price: string
}

type ItemWithExam = RequestItemInput & { _exam: ExamOption }

interface PrefilledPatient {
  patientId: string
  patientName: string
  patientDocumentNumber: string
}

const STEPS = [
  { number: 1, label: 'Patient & Exams' },
  { number: 2, label: 'Source & Billing' },
  { number: 3, label: 'Recap & Confirmation' },
] as const

export function RequestCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mutation = useCreateRequest()

  // Prefilled patient from Patients navigation
  const prefilled = location.state as PrefilledPatient | null
  const isPatientLocked = Boolean(prefilled?.patientId)

  // Step state
  const [step, setStep] = useState(1)

  // Form state — preserved across Back/Next so users can freely iterate.
  const [patientId, setPatientId] = useState(prefilled?.patientId ?? '')
  const [patientSearch, setPatientSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('DIRECT_PATIENT')
  const [partnerId, setPartnerId] = useState<string>('')
  const [externalRef, setExternalRef] = useState('')
  const [billingMode, setBillingMode] = useState<RequestBillingMode>('DIRECT_PAYMENT')
  const [sourceNotes, setSourceNotes] = useState('')
  const [items, setItems] = useState<ItemWithExam[]>([])
  const [examSearch, setExamSearch] = useState('')

  // Data queries
  const { data: patientsData } = usePatients({ search: patientSearch, is_active: 'true' })
  const patients = patientsData?.data ?? []
  const selectedPatient = patients.find((p) => p.id === patientId)

  const { data: partnersData } = useActivePartners()
  const partners = partnersData ?? []
  const selectedPartner = partners.find((p) => p.id === partnerId)

  const { data: examsData } = useExamDefinitions({ search: examSearch, is_active: 'true', is_enabled: 'true' })
  const allExams = examsData?.data ?? []
  const addedExamIds = new Set(items.map((i) => i.exam_definition_id))
  const availableExams = allExams.filter((e) => !addedExamIds.has(e.id))

  // Backend-resolved pricing for the recap step. Enabled only on Step 3
  // so the server is not polled during Steps 1/2 when the user is still
  // assembling the request. React Query caches per-parameter, so going
  // back to Step 2 and returning to Step 3 with the same selections is
  // a cache hit — no visible loading flash on re-entry.
  const previewExamIds = useMemo(
    () => items
      .filter((i) => i.execution_mode !== 'REJECTED')
      .map((i) => i.exam_definition_id),
    [items],
  )
  const {
    data: previewData,
    isFetching: previewLoading,
    error: previewError,
  } = usePricingPreview(
    {
      source_type: sourceType,
      partner_organization_id: sourceType === 'PARTNER_ORGANIZATION' ? partnerId : null,
      exam_definition_ids: previewExamIds,
    },
    { enabled: step === 3 },
  )
  const resolvedItems: ResolvedItemPrice[] = previewData?.items ?? []
  const resolvedTotal = resolvedItems.reduce(
    (sum, r) => sum + Number(r.billed_price || '0'),
    0,
  )

  // Item management
  const addItem = useCallback((exam: ExamOption) => {
    setItems((prev) => [...prev, {
      exam_definition_id: exam.id,
      execution_mode: 'INTERNAL',
      external_partner_name: '',
      notes: '',
      billed_price: null,
      _exam: exam,
    }])
  }, [])

  const updateItem = useCallback((index: number, updates: Partial<RequestItemInput>) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, ...updates } : item))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Client-side estimated total for the sidebar in Steps 1 and 2 — uses
  // the exam's current reference unit_price. Step 3 overrides this with
  // the backend-resolved total from ``usePricingPreview``.
  const estimatedTotal = items.reduce((sum, item) => {
    if (item.execution_mode === 'REJECTED') return sum
    const price = parseFloat(item._exam.unit_price)
    return sum + (Number.isNaN(price) ? 0 : price)
  }, 0)

  // Step validation
  const step1Valid = Boolean(patientId) && items.length > 0
  const step2Valid = sourceType === 'DIRECT_PATIENT' || Boolean(partnerId)

  // Navigation
  function goToStep2() {
    if (!patientId) { toast.error('Please select a patient.'); return }
    if (items.length === 0) { toast.error('Please add at least one exam.'); return }
    setStep(2)
  }

  function goToStep3() {
    if (sourceType === 'PARTNER_ORGANIZATION' && !partnerId) {
      toast.error('Please select a partner organization.')
      return
    }
    setStep(3)
  }

  async function handleConfirm() {
    if (!step1Valid || !step2Valid) return
    try {
      const request = await mutation.mutateAsync({
        patient_id: patientId,
        notes,
        source_type: sourceType,
        partner_organization_id: sourceType === 'PARTNER_ORGANIZATION' ? partnerId : null,
        external_reference: externalRef,
        billing_mode: billingMode,
        source_notes: sourceNotes,
        // ``billed_price`` and the ``_exam`` display cache are deliberately
        // omitted: the new 3-step flow defers all pricing to the backend
        // resolver so preview ↔ final create stay structurally consistent.
        items: items.map((item) => ({
          exam_definition_id: item.exam_definition_id,
          execution_mode: item.execution_mode,
          external_partner_name: item.external_partner_name,
          notes: item.notes,
        })),
        // The final button of the 3-step wizard semantically commits
        // the request. The backend atomically creates AND transitions
        // to CONFIRMED when this flag is true, so the resulting request
        // matches the UI wording.
        confirm: true,
      })
      toast.success(
        `Request ${request.request_number} created and confirmed.`,
      )
      navigate(`/requests/${request.id}`)
    } catch {
      toast.error('Failed to confirm request.')
    }
  }

  const isPartnerSource = sourceType === 'PARTNER_ORGANIZATION'
  const patientDisplayName = prefilled?.patientName ?? selectedPatient?.full_name ?? 'Not selected'
  const patientDocument = prefilled?.patientDocumentNumber ?? selectedPatient?.document_number ?? ''
  const sourceTypeLabel = SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType)?.label ?? sourceType
  const billingModeLabel = BILLING_MODE_OPTIONS.find((o) => o.value === billingMode)?.label ?? billingMode

  // Billing mode is a function of source type: direct patients are
  // always billed directly, partner requests are always billed through
  // the partner. Computing the allowed subset here (rather than in a
  // shared util) keeps the business rule co-located with the wizard
  // that enforces it, and the filter automatically adapts if the
  // backend later introduces more billing modes that fit one side or
  // the other.
  const allowedBillingModes = useMemo(
    () => BILLING_MODE_OPTIONS.filter((o) => (
      sourceType === 'PARTNER_ORGANIZATION'
        ? o.value === 'PARTNER_BILLING'
        : o.value === 'DIRECT_PAYMENT'
    )),
    [sourceType],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Analysis Request"
        breadcrumbs={[{ label: 'Requests', href: ROUTES.REQUESTS }, { label: 'New' }]}
      />

      {/* Step indicator — 3 steps */}
      <div className="flex items-center gap-3 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center gap-3">
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step > s.number
                  ? 'bg-emerald-100 text-emerald-700'
                  : step === s.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.number ? <Check className="h-3.5 w-3.5" /> : s.number}
              </div>
              <span className={`text-sm font-medium ${
                step === s.number ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">

          {/* ============================================================
              STEP 1: Patient & Exams
              ============================================================ */}
          {step === 1 && (
            <>
              {/* Patient selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patient</CardTitle>
                </CardHeader>
                <CardContent>
                  {isPatientLocked ? (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                      <div>
                        <p className="font-medium">{prefilled!.patientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{prefilled!.patientDocumentNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Locked</Badge>
                    </div>
                  ) : selectedPatient ? (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                      <div>
                        <p className="font-medium">{selectedPatient.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{selectedPatient.document_number}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPatientId('')}>Change</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SearchInput
                        placeholder="Search patient by name or document number..."
                        value={patientSearch}
                        onChange={setPatientSearch}
                      />
                      {patientSearch && patients.length > 0 && (
                        <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                          {patients.slice(0, 10).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setPatientId(p.id); setPatientSearch('') }}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                            >
                              <span className="font-medium">{p.full_name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{p.document_number}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exam items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Exam Items</CardTitle>
                      <CardDescription>Add exams to this request. Prices are resolved automatically at the recap step.</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm tabular-nums">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <SearchInput
                      placeholder="Search exams by name or code to add..."
                      value={examSearch}
                      onChange={setExamSearch}
                    />
                    {examSearch && availableExams.length > 0 && (
                      <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                        {availableExams.slice(0, 8).map((exam) => (
                          <button
                            key={exam.id}
                            type="button"
                            onClick={() => {
                              addItem({ id: exam.id, code: exam.code, name: exam.name, sample_type: exam.sample_type, unit_price: exam.unit_price })
                              setExamSearch('')
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                          >
                            <span className="flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5 text-primary" />
                              <span className="font-mono text-xs text-muted-foreground">{exam.code}</span>
                              <span>{exam.name}</span>
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">{formatCurrency(exam.unit_price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <EmptyState
                      icon={FlaskConical}
                      title="No exams added yet"
                      description="Search and select exams from the catalog above."
                    />
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <RequestItemRow
                          key={item.exam_definition_id}
                          item={item}
                          index={index}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                          // The new 3-step flow defers all pricing to the
                          // backend — no manual override in the row UI.
                          allowPriceOverride={false}
                          // Step 1 stays minimal and operational; the
                          // external partner field is not surfaced here.
                          showExternalPartner={false}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 1 actions */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.REQUESTS)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={!step1Valid}
                  onClick={goToStep2}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ============================================================
              STEP 2: Source & Billing
              ============================================================ */}
          {step === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Source & Billing</CardTitle>
                  <CardDescription>How this request originated and who is billed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Source type" htmlFor="source-type" required>
                      <Select
                        value={sourceType}
                        onValueChange={(v) => {
                          if (!v) return
                          const st = v as SourceType
                          setSourceType(st)
                          if (st === 'DIRECT_PATIENT') { setPartnerId(''); setBillingMode('DIRECT_PAYMENT') }
                          else { setBillingMode('PARTNER_BILLING') }
                        }}
                        items={SOURCE_TYPE_OPTIONS}
                      >
                        <SelectTrigger id="source-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField
                      label="Billing mode"
                      htmlFor="billing-mode"
                      required
                      hint={
                        allowedBillingModes.length === 1
                          ? 'Determined by the selected source type.'
                          : undefined
                      }
                    >
                      <Select
                        value={billingMode}
                        onValueChange={(v) => { if (v) setBillingMode(v as RequestBillingMode) }}
                        items={allowedBillingModes}
                        // When only one billing mode is valid for the
                        // current source, the select becomes a display
                        // field — the user sees the value but cannot
                        // pick an invalid combination.
                        disabled={allowedBillingModes.length <= 1}
                      >
                        <SelectTrigger id="billing-mode"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allowedBillingModes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  {isPartnerSource && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Partner organization" htmlFor="partner" required>
                        <Select
                          value={partnerId}
                          onValueChange={(v) => setPartnerId(v ?? '')}
                          items={partners.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                        >
                          <SelectTrigger id="partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                          <SelectContent>
                            {partners.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="External reference" htmlFor="ext-ref"
                        hint="Partner's own order or reference number.">
                        <Input id="ext-ref" placeholder="e.g. ORD-2026-001" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} />
                      </FormField>
                    </div>
                  )}

                  <FormField label="Source notes" htmlFor="source-notes">
                    <Textarea id="source-notes" rows={2} placeholder="Additional context about the request origin..."
                      value={sourceNotes} onChange={(e) => setSourceNotes(e.target.value)} />
                  </FormField>
                </CardContent>
              </Card>

              {/* Step 2 actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={!step2Valid}
                  onClick={goToStep3}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ============================================================
              STEP 3: Recap & Confirmation
              ============================================================ */}
          {step === 3 && (
            <>
              {/* Identity + source summary cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Patient
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">{patientDisplayName}</p>
                    {patientDocument && (
                      <p className="text-xs text-muted-foreground font-mono">{patientDocument}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">{sourceTypeLabel}</p>
                    {isPartnerSource && selectedPartner && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPartner.name} <span className="font-mono">({selectedPartner.code})</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Billing: {billingModeLabel}</p>
                    {externalRef && (
                      <p className="text-xs text-muted-foreground font-mono">Ref: {externalRef}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Resolved pricing table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Resolved pricing</CardTitle>
                      <CardDescription>
                        {isPartnerSource
                          ? 'Agreed prices are applied where negotiated for this partner; otherwise the catalog reference price is used.'
                          : 'Direct patient requests are billed at the catalog reference price.'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm tabular-nums">
                      {resolvedItems.length} item{resolvedItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previewError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Failed to load resolved pricing. Go back and try again.
                    </div>
                  ) : previewLoading && resolvedItems.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resolving prices…
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Exam</TableHead>
                            <TableHead className="text-right">Unit price</TableHead>
                            <TableHead className="text-right">Billed</TableHead>
                            <TableHead className="w-24" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resolvedItems.map((row) => (
                            <ResolvedRow key={row.exam_definition_id} row={row} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-2xl font-bold font-mono tabular-nums">
                      {formatCurrency(resolvedTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={mutation.isPending || previewLoading || !!previewError}
                  onClick={handleConfirm}
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" />
                  Confirm &amp; Create Request
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar summary — live across all 3 steps */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <SummaryRow label="Patient" value={patientDisplayName} />
                <SummaryRow label="Source" value={sourceTypeLabel} />
                {isPartnerSource && selectedPartner && (
                  <SummaryRow label="Partner" value={selectedPartner.name} />
                )}
                <SummaryRow label="Items" value={String(items.length)} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {step === 3 ? 'Total' : 'Estimated total'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {formatCurrency(step === 3 ? resolvedTotal : estimatedTotal)}
                </span>
              </div>
              {step < 3 && items.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Estimate based on catalog unit prices. The final billed total is
                  resolved at the recap step.
                </p>
              )}

              <FormField label="Notes" htmlFor="req-notes">
                <Textarea
                  id="req-notes"
                  rows={2}
                  placeholder="Fasting sample, urgent..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Private components
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate ml-2">{value}</span>
    </div>
  )
}

function ResolvedRow({ row }: { row: ResolvedItemPrice }) {
  const isAgreed = row.price_source === ('PARTNER_AGREED_PRICE' as PriceSource)
  return (
    <TableRow>
      <TableCell className="font-mono text-xs font-medium">{row.exam_code}</TableCell>
      <TableCell className="text-sm">{row.exam_name}</TableCell>
      <TableCell className="text-right font-mono text-xs text-muted-foreground">
        {formatCurrency(row.unit_price)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold">
        {formatCurrency(row.billed_price)}
      </TableCell>
      <TableCell className="text-right">
        {isAgreed ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
          >
            <Tag className="h-3 w-3" />
            Agreed
          </Badge>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
