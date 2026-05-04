import { useMemo, useState } from 'react'
import { AlertTriangle, Eye, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/shared/FormField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  findDisallowedVariables,
  renderSafeNotificationTemplate,
} from '../safeTemplate'

interface Props {
  /** Operator-typed subject template. Empty string is the canonical
   *  "use default" signal — the backend renderer falls back to
   *  ``"Your lab result is ready"``. */
  subjectTemplate: string
  /** Operator-typed body template. Empty string falls back to the
   *  pre-rollout hard-coded body verbatim. */
  bodyTemplate: string
  /** Current lab name — used in the live preview's sample context
   *  so the operator sees their own brand instead of a generic
   *  "Cytova Lab" placeholder. */
  labName: string
  onSubjectChange: (next: string) => void
  onBodyChange: (next: string) => void
}

/**
 * Lab Settings — patient-result notification email template editor.
 *
 * The user-facing surface for the customisable-templates rollout
 * (backend Phases 1–2). Two text fields, a friendly variables
 * list, a "Reset to default" affordance, and a live email preview
 * that mirrors the real Brevo HTML — including the always-rendered
 * CTA button required by the backend renderer.
 *
 * Real-time validation
 * --------------------
 * ``findDisallowedVariables`` runs on every render. The amber
 * banner is informational; the server validator is the
 * authoritative gate. Surfacing the issue while typing prevents
 * the Save → 400 → fix → Save loop the operator would otherwise
 * hit.
 *
 * CTA enforcement
 * ---------------
 * The preview renders the "View my results" button below the body
 * regardless of whether the operator includes ``{{ result_link }}``
 * in their text. This matches the backend renderer's behaviour:
 * ``render_patient_result_ready`` always emits the CTA in the HTML
 * shell (spec §5: "result link should still be shown as a CTA
 * button"), so what the operator sees in the preview is what the
 * patient receives.
 */
export function PatientEmailTemplateSection({
  subjectTemplate, bodyTemplate, labName,
  onSubjectChange, onBodyChange,
}: Props) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Disallowed variables in either field. Computed on every render
  // — the helpers are pure regex passes over short strings, cheap
  // enough to avoid memoisation.
  const subjectIssues = findDisallowedVariables(subjectTemplate)
  const bodyIssues = findDisallowedVariables(bodyTemplate)

  // Sample context for the preview. Realistic values per spec §3
  // make the operator's preview feel like a real email instead of
  // a placeholder dump. ``lab_name`` falls back to ``"Cytova Lab"``
  // when the lab hasn't set their own brand yet, matching the
  // spec's literal sample.
  const sampleContext = useMemo<Record<string, string>>(() => ({
    patient_first_name: 'John',
    lab_name: labName || 'Cytova Lab',
    result_link: 'https://app.cytova.io/r/SAMPLE-LINK',
    request_reference: 'REQ-0001',
  }), [labName])

  // Subject preview falls back to the canonical default when the
  // template renders empty, mirroring the backend behaviour.
  const subjectPreview = (
    renderSafeNotificationTemplate(subjectTemplate, sampleContext).trim()
    || 'Your lab result is ready'
  )

  // Body preview: render the operator's template if non-empty;
  // fall back to a substituted version of the canonical default
  // body so the preview still reads naturally when the field is
  // blank.
  const bodyPreview = bodyTemplate
    ? renderSafeNotificationTemplate(bodyTemplate, sampleContext)
    : renderSafeNotificationTemplate(_DEFAULT_BODY, sampleContext)

  function handleReset() {
    onSubjectChange('')
    onBodyChange('')
    setShowResetConfirm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header row — section title cue + Reset CTA right-aligned */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Empty fields fall back to the safe default copy.
        </p>
        <Button
          type="button" variant="ghost" size="sm" className="gap-1.5 text-xs"
          onClick={() => setShowResetConfirm(true)}
          disabled={!subjectTemplate && !bodyTemplate}
        >
          <RotateCcw className="h-3 w-3" />
          Reset to default
        </Button>
      </div>

      {/* Subject field */}
      <FormField
        label="Email subject"
        htmlFor="patient-email-subject-template"
        hint="Empty falls back to “Your lab result is ready”."
      >
        <Input
          id="patient-email-subject-template"
          value={subjectTemplate}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Your lab result is ready"
        />
      </FormField>
      {subjectIssues.length > 0 && (
        <DisallowedWarning fieldLabel="subject" disallowed={subjectIssues} />
      )}

      {/* Body field — generous height, monospace, comfortable line
          height so multi-paragraph templates are readable. */}
      <FormField
        label="Email body"
        htmlFor="patient-email-body-template"
        hint="Multi-line text supported. Use the variables below to personalise."
      >
        <Textarea
          id="patient-email-body-template"
          value={bodyTemplate}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={8}
          placeholder={_DEFAULT_BODY}
          className="font-mono text-xs leading-relaxed"
        />
      </FormField>
      {bodyIssues.length > 0 && (
        <DisallowedWarning fieldLabel="body" disallowed={bodyIssues} />
      )}

      {/* Variables — friendly plain-language list mapping label →
          placeholder. Replaces the previous code-line dump with
          something an operator can scan without parsing curly braces. */}
      <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
        <p className="text-xs font-medium text-foreground">
          You can use the following variables:
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          {VARIABLES.map((v) => (
            <li key={v.name} className="flex items-baseline gap-2">
              <span className="text-muted-foreground">• {v.label}</span>
              <span className="text-muted-foreground">→</span>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-slate-200">
                {`{{ ${v.name} }}`}
              </code>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          The result link is always shown as a button in the email,
          regardless of whether you include {' '}
          <code className="font-mono text-[11px]">{'{{ result_link }}'}</code>
          {' '} in the body. Patient identity beyond first name,
          medical values, exam names, and PDF passwords cannot be
          inserted.
        </p>
      </div>

      {/* Live preview — realistic email envelope so the operator
          sees what the patient will receive. */}
      <EmailPreview
        subject={subjectPreview}
        body={bodyPreview}
        labName={sampleContext.lab_name}
      />

      {/* Reset confirmation — keeps the destructive action one
          click away from accidental triggers. */}
      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset email templates to default?"
        description={
          'This clears your custom subject and body. Patients will '
          + 'receive the standard Cytova message until you save new '
          + 'templates.'
        }
        confirmLabel="Reset"
        onConfirm={handleReset}
      />
    </div>
  )
}


// ---------------------------------------------------------------------------
// Inline warning — placeholder NOT in the allow-list
// ---------------------------------------------------------------------------

/**
 * Distinct from the server's field-level error (which fires only
 * on Save). This is the convenience layer — it doesn't block save,
 * it just nudges the operator before they click Save. Lists every
 * offender in monospace so the operator can grep their template
 * for the bad placeholder.
 */
function DisallowedWarning({
  fieldLabel, disallowed,
}: {
  fieldLabel: string
  disallowed: string[]
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">
          The {fieldLabel} contains placeholder
          {disallowed.length > 1 ? 's' : ''} that
          {disallowed.length > 1 ? ' are not allowed' : ' is not allowed'}.
        </p>
        <p className="mt-0.5 font-mono break-all">
          {disallowed.map((name) => `{{ ${name} }}`).join(' · ')}
        </p>
        <p className="mt-1 text-amber-800">
          Saving will be rejected until you remove
          {disallowed.length > 1 ? ' them' : ' it'}.
        </p>
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Email preview — envelope-style mock of the rendered Brevo email
// ---------------------------------------------------------------------------

/**
 * Visual preview of the rendered email. Frame mimics an inbox row
 * (subject in bold, body in serif-ish text, branded CTA button)
 * so the operator can see their template the way a patient will.
 *
 * The CTA is rendered ALWAYS — even if the operator omits
 * ``{{ result_link }}`` from their body — because the backend
 * renderer always emits it as part of the HTML shell. Showing the
 * button only when the placeholder is present in the body would
 * mislead the operator about the actual patient experience.
 */
function EmailPreview({
  subject, body, labName,
}: {
  subject: string
  body: string
  labName: string
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-muted-foreground">
        <Eye className="h-3 w-3" />
        Email preview
      </div>
      <div className="space-y-4 px-4 py-4">
        {/* Subject */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Subject
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {subject}
          </p>
        </div>

        {/* Body — pre-wrap preserves the operator's line breaks +
            paragraph spacing exactly the way the backend's HTML
            paragraph formatter will render them. */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Body
          </p>
          <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {body}
          </pre>
        </div>

        {/* CTA button — always rendered. The fake button styling
            matches the real email's button so the operator gets a
            faithful preview. */}
        <div>
          <span className="inline-block rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white">
            View my results
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            (Always shown to patients — not removed by your
            template.)
          </p>
        </div>

        {/* Footer — lab name preview to match the real email shell. */}
        <p className="border-t border-slate-200 pt-2 text-[11px] text-muted-foreground">
          Sent on behalf of {labName}.
        </p>
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Plain-language label → placeholder mapping. The order is the
 *  display order in the variables block — most-used first. */
const VARIABLES: ReadonlyArray<{ label: string; name: string }> = [
  { label: 'Patient name',       name: 'patient_first_name' },
  { label: 'Lab name',           name: 'lab_name' },
  { label: 'Secure result link', name: 'result_link' },
  { label: 'Request reference',  name: 'request_reference' },
]

/** Default body text — matches the migration default verbatim.
 *  Used as the textarea placeholder AND as the preview fallback
 *  when the field is blank, so the operator always sees the
 *  canonical shape they'll get if they leave the field empty. */
const _DEFAULT_BODY = (
  'Hello {{ patient_first_name }},\n\n'
  + 'Your lab result is ready. You can access it securely using '
  + 'the link below:\n\n'
  + '{{ result_link }}\n\n'
  + 'For your privacy, please do not share this link.'
)
