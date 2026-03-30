import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Plus, FlaskConical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RequestItemRow } from '../components/RequestItemRow'
import { useCreateRequest } from '../api'
import { usePatients } from '@/modules/patients/api'
import { useActivePartners } from '@/modules/partners/api'
import { useExamDefinitions } from '@/modules/catalog/api'
import { formatCurrency } from '@/lib/utils/currency'
import { ROUTES } from '@/config/routes'
import { SOURCE_TYPE_OPTIONS, BILLING_MODE_OPTIONS } from '../types'
import type { SourceType, RequestBillingMode, RequestItemInput } from '../types'

interface ExamOption {
  id: string
  code: string
  name: string
  sample_type: string
  unit_price: string
}

type ItemWithExam = RequestItemInput & { _exam: ExamOption }

export function RequestCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateRequest()

  // Form state
  const [patientId, setPatientId] = useState('')
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

  const { data: examsData } = useExamDefinitions({ search: examSearch, is_active: 'true', is_enabled: 'true' })
  const allExams = examsData?.data ?? []
  const addedExamIds = new Set(items.map((i) => i.exam_definition_id))
  const availableExams = allExams.filter((e) => !addedExamIds.has(e.id))

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

  // Totals
  const total = items.reduce((sum, item) => {
    if (item.execution_mode === 'REJECTED') return sum
    const price = item.billed_price ? parseFloat(item.billed_price) : parseFloat(item._exam.unit_price)
    return sum + (isNaN(price) ? 0 : price)
  }, 0)

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) { toast.error('Please select a patient.'); return }
    if (items.length === 0) { toast.error('Please add at least one exam.'); return }
    if (sourceType === 'PARTNER_ORGANIZATION' && !partnerId) { toast.error('Please select a partner organization.'); return }

    try {
      const request = await mutation.mutateAsync({
        patient_id: patientId,
        notes,
        source_type: sourceType,
        partner_organization_id: sourceType === 'PARTNER_ORGANIZATION' ? partnerId : null,
        external_reference: externalRef,
        billing_mode: billingMode,
        source_notes: sourceNotes,
        items: items.map(({ _exam, ...rest }) => ({
          ...rest,
          billed_price: rest.billed_price || undefined,
        })),
      })
      toast.success(`Request ${request.request_number} created.`)
      navigate(`/requests/${request.id}`)
    } catch {
      toast.error('Failed to create request.')
    }
  }

  const isPartnerSource = sourceType === 'PARTNER_ORGANIZATION'

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Analysis Request"
        breadcrumbs={[{ label: 'Requests', href: ROUTES.REQUESTS }, { label: 'New' }]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Patient selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patient</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <div>
                      <p className="font-medium">{selectedPatient.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedPatient.national_id}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPatientId('')}>Change</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SearchInput
                      placeholder="Search patient by name or national ID..."
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
                            <span className="text-xs text-muted-foreground font-mono">{p.national_id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source & billing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source & Billing</CardTitle>
                <CardDescription>How this request originated and who is billed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Source type" htmlFor="source-type" required>
                    <Select value={sourceType} onValueChange={(v) => {
                      if (!v) return
                      const st = v as SourceType
                      setSourceType(st)
                      if (st === 'DIRECT_PATIENT') { setPartnerId(''); setBillingMode('DIRECT_PAYMENT') }
                      else { setBillingMode('PARTNER_BILLING') }
                    }}>
                      <SelectTrigger id="source-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Billing mode" htmlFor="billing-mode" required>
                    <Select value={billingMode} onValueChange={(v) => { if (v) setBillingMode(v as RequestBillingMode) }}>
                      <SelectTrigger id="billing-mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BILLING_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {isPartnerSource && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Partner organization" htmlFor="partner" required>
                      <Select value={partnerId} onValueChange={(v) => setPartnerId(v ?? '')}>
                        <SelectTrigger id="partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                        <SelectContent>
                          {partners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} <span className="text-muted-foreground">({p.code})</span>
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

            {/* Exam items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Exam Items</CardTitle>
                    <CardDescription>Add exams to this request. Prices are resolved automatically.</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm tabular-nums">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exam picker */}
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

                {/* Item list */}
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
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="font-medium truncate ml-2">{selectedPatient?.full_name || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{isPartnerSource ? 'Partner' : 'Direct'}</span>
                  </div>
                  {isPartnerSource && partnerId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partner</span>
                      <span className="font-medium truncate ml-2">
                        {partners.find((p) => p.id === partnerId)?.name || '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Estimated total</span>
                  <span className="text-lg font-bold font-mono tabular-nums">{formatCurrency(total)}</span>
                </div>

                <FormField label="Notes" htmlFor="req-notes">
                  <Textarea
                    id="req-notes"
                    rows={2}
                    placeholder="Fasting sample, urgent..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </FormField>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || !patientId || items.length === 0}
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(ROUTES.REQUESTS)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
