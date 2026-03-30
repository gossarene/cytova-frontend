import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' }

  let score = 0
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak' }
  if (score <= 2) return { score: 2, label: 'Fair' }
  if (score <= 3) return { score: 3, label: 'Good' }
  return { score: 4, label: 'Strong' }
}

const COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500']
const LABEL_COLORS = ['', 'text-red-600', 'text-amber-600', 'text-emerald-600', 'text-emerald-600']

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label } = getStrength(password)

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= score ? COLORS[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', LABEL_COLORS[score])}>
        {label}
      </p>
    </div>
  )
}
