import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VerifyEmailStepProps {
  email: string
  /** Submit a 6-digit code; resolves on success, throws on failure (with optional message). */
  onVerify: (code: string) => Promise<void>
  /** Trigger a resend; resolves on success, throws on cooldown/lockout. */
  onResend: () => Promise<void>
  /** Free-text error to surface (server-derived). */
  error: string | null
  /** Cooldown in seconds; the resend button is disabled until this hits 0. */
  initialCooldownSeconds?: number
}

const CODE_LENGTH = 6

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`
}

export function VerifyEmailStep({
  email,
  onVerify,
  onResend,
  error,
  initialCooldownSeconds = 60,
}: VerifyEmailStepProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''))
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(initialCooldownSeconds)
  const [touched, setTouched] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  // Keep cooldown live without driving a render every frame.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // Auto-focus first cell on mount.
  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function setDigitAt(idx: number, value: string) {
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }

  function handleChange(idx: number, raw: string) {
    setTouched(true)
    // Strip non-digits and accept paste of multiple digits.
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setDigitAt(idx, '')
      return
    }
    // If multiple digits arrive (paste), distribute starting at idx.
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < cleaned.length && idx + i < CODE_LENGTH; i++) {
        next[idx + i] = cleaned[i]
      }
      return next
    })
    // Move focus forward to first empty cell after the pasted run.
    const nextIdx = Math.min(CODE_LENGTH - 1, idx + cleaned.length)
    inputs.current[nextIdx]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
      setDigitAt(idx - 1, '')
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputs.current[idx - 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'Enter') {
      void submit()
    }
  }

  async function submit() {
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) {
      setTouched(true)
      return
    }
    setSubmitting(true)
    try {
      await onVerify(code)
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    if (cooldown > 0 || resending) return
    setResending(true)
    try {
      await onResend()
      setCooldown(initialCooldownSeconds)
      setDigits(Array(CODE_LENGTH).fill(''))
      setTouched(false)
      inputs.current[0]?.focus()
    } finally {
      setResending(false)
    }
  }

  const codeComplete = digits.every((d) => d !== '')
  const showError = touched && error

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Verify your email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{maskEmail(email)}</span>.
          Enter it below to continue.
        </p>
      </div>

      <div>
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={(e) => {
          // Allow paste anywhere in the row to fill all cells.
          const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
          if (text) {
            e.preventDefault()
            handleChange(0, text)
          }
        }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              aria-invalid={!!showError || undefined}
              className={cn(
                'h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-semibold tabular-nums shadow-xs outline-none transition-colors',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
              )}
            />
          ))}
        </div>

        {showError && (
          <p className="mt-3 text-center text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-colors',
            cooldown > 0 || resending
              ? 'text-muted-foreground'
              : 'text-primary hover:underline',
          )}
        >
          {resending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>

        <Button
          type="button"
          onClick={submit}
          disabled={!codeComplete || submitting}
          className="gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify email
        </Button>
      </div>
    </div>
  )
}
