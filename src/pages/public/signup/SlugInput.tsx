import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { env } from '@/config/env'
import { checkSlugAvailability } from './api'

interface SlugInputProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange: (available: boolean | null) => void
  error?: string
}

/**
 * Slug input with real-time availability checking and domain preview.
 */
export function SlugInput({ value, onChange, onAvailabilityChange, error }: SlugInputProps) {
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<{
    available: boolean
    reason: string | null
  } | null>(null)

  const checkAvailability = useCallback(
    async (slug: string) => {
      if (slug.length < 3) {
        setAvailability(null)
        onAvailabilityChange(null)
        return
      }
      setChecking(true)
      try {
        const result = await checkSlugAvailability(slug)
        setAvailability({ available: result.available, reason: result.reason })
        onAvailabilityChange(result.available)
      } catch {
        setAvailability(null)
        onAvailabilityChange(null)
      } finally {
        setChecking(false)
      }
    },
    [onAvailabilityChange],
  )

  useEffect(() => {
    if (!value || value.length < 3) {
      setAvailability(null)
      onAvailabilityChange(null)
      return
    }
    const timer = setTimeout(() => checkAvailability(value), 400)
    return () => clearTimeout(timer)
  }, [value, checkAvailability, onAvailabilityChange])

  function handleChange(raw: string) {
    // Enforce slug format as user types: lowercase, alphanumeric + hyphens
    const cleaned = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .slice(0, 63)
    onChange(cleaned)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="my-laboratory"
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!checking && availability?.available === true && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {!checking && availability?.available === false && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>

      {/* Domain preview */}
      {value && value.length >= 3 && (
        <p className="text-xs text-muted-foreground">
          Your lab will be accessible at{' '}
          <span className="font-medium text-foreground">
            {value}.{env.domain}
          </span>
        </p>
      )}

      {/* Availability message */}
      {!checking && availability?.available === false && (
        <p className="text-xs text-destructive">
          {availability.reason || 'This identifier is not available.'}
        </p>
      )}
      {!checking && availability?.available === true && (
        <p className="text-xs text-emerald-600">
          This identifier is available.
        </p>
      )}
      {error && !availability && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
