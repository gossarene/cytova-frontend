/**
 * Shared mappings for cockpit cards: backend's semantic strings (icon name,
 * tone) → concrete Lucide components and Tailwind class fragments. Keeping
 * this in one place lets every cockpit card render consistently and lets
 * the backend stay UI-agnostic.
 */
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, Bell, CheckCircle2, ClipboardCheck, ClipboardList,
  Eye, FlaskConical, Hourglass, Mail, PackageCheck, Pipette, Receipt,
  RefreshCw, ArrowRightLeft, Boxes, FileSignature, Workflow,
} from 'lucide-react'
import type { DashboardTone } from '../types'

const ICONS: Record<string, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  'bell': Bell,
  'check-circle-2': CheckCircle2,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  'eye': Eye,
  'flask-conical': FlaskConical,
  'hourglass': Hourglass,
  'mail': Mail,
  'package-check': PackageCheck,
  'pipette': Pipette,
  'receipt': Receipt,
  'refresh-cw': RefreshCw,
}

const FALLBACK_ICON: LucideIcon = ClipboardList

export function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? FALLBACK_ICON
}

/**
 * Action-key → icon heuristic. Action cards don't carry an explicit icon
 * field on the backend payload, so we derive one from the key. Keeps the
 * UI consistent without forcing the cockpit composer to learn icons.
 */
export function resolveActionIcon(key: string): LucideIcon {
  const k = key.toLowerCase()
  if (k.includes('alert')) return AlertTriangle
  if (k.includes('bill') || k.includes('invoice') || k.includes('revenue')) return Receipt
  if (k.includes('stock') || k.includes('lot') || k.includes('inventory')) return Boxes
  if (k.includes('order') || k.includes('procure')) return PackageCheck
  if (k.includes('valid') || k.includes('review') || k.includes('release')) return ClipboardCheck
  if (k.includes('publish') || k.includes('result')) return FileSignature
  if (k.includes('reception') || k.includes('collect') || k.includes('intake')) return Pipette
  if (k.includes('analy') || k.includes('process') || k.includes('exec')) return FlaskConical
  if (k.includes('transfer') || k.includes('route')) return ArrowRightLeft
  if (k.includes('workflow') || k.includes('pending')) return Workflow
  return Bell
}

/**
 * Tone → Tailwind class fragments.
 *
 * Card surface uses ONE shared treatment across every tone — soft white-to-
 * gray gradient + hairline border + premium two-step shadow + scale-on-hover —
 * so all cards read as members of the same family (matches the public landing
 * page card energy). Tone only colours the icon chip, the value text accent,
 * the action card's left rail, and the KPI card's top gradient line. This is
 * the banking-app pattern: a uniform substrate plus tiny coloured signals,
 * rather than tinted card backgrounds that fight each other.
 */
const PREMIUM_SURFACE =
  'rounded-xl border border-black/5 bg-gradient-to-br from-white to-gray-50 ' +
  'shadow-[0_10px_30px_rgba(0,0,0,0.06)] ' +
  'hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] ' +
  'transition-all duration-200'

export const TONE_CLASSES: Record<DashboardTone, {
  /** Shared surface treatment. Identical across tones — see PREMIUM_SURFACE. */
  surface: string
  /** Icon chip background + foreground. */
  iconChip: string
  /** Accent colour for the metric value. */
  accent: string
  /** Left rail colour for action cards (4px accent border-l). */
  rail: string
  /** Top gradient accent line for KPI cards (the 3px stripe). */
  accentLine: string
  /** Soft background tint for accent dots / mini badges. */
  softBg: string
}> = {
  primary: {
    surface:    PREMIUM_SURFACE,
    iconChip:   'bg-blue-100 text-blue-600 ring-1 ring-inset ring-blue-200/60 shadow-sm shadow-blue-500/10',
    accent:     'text-blue-700',
    rail:       'border-l-blue-500',
    accentLine: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    softBg:     'bg-blue-50',
  },
  success: {
    surface:    PREMIUM_SURFACE,
    iconChip:   'bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-200/60 shadow-sm shadow-emerald-500/10',
    accent:     'text-emerald-700',
    rail:       'border-l-emerald-500',
    accentLine: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    softBg:     'bg-emerald-50',
  },
  warning: {
    surface:    PREMIUM_SURFACE,
    iconChip:   'bg-amber-100 text-amber-600 ring-1 ring-inset ring-amber-200/60 shadow-sm shadow-amber-500/10',
    accent:     'text-amber-700',
    rail:       'border-l-amber-500',
    accentLine: 'bg-gradient-to-r from-amber-500 to-orange-500',
    softBg:     'bg-amber-50',
  },
  danger: {
    surface:    PREMIUM_SURFACE,
    iconChip:   'bg-rose-100 text-rose-600 ring-1 ring-inset ring-rose-200/60 shadow-sm shadow-rose-500/10',
    accent:     'text-rose-700',
    rail:       'border-l-rose-500',
    accentLine: 'bg-gradient-to-r from-rose-500 to-pink-500',
    softBg:     'bg-rose-50',
  },
  neutral: {
    surface:    PREMIUM_SURFACE,
    iconChip:   'bg-violet-100 text-violet-600 ring-1 ring-inset ring-violet-200/60 shadow-sm shadow-violet-500/10',
    accent:     'text-slate-900',
    rail:       'border-l-violet-400',
    accentLine: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    softBg:     'bg-violet-50',
  },
}

/** Convenience for chart cards / non-toned cards that want the same
 *  premium substrate as KPI/action cards. */
export const PREMIUM_SURFACE_CLASSES = PREMIUM_SURFACE

/** Greeting that adapts to the current local time. */
export function greetingPrefix(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
