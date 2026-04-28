/**
 * useUnsavedChangesGuard — protect a dirty form from accidental data loss.
 *
 * Two layers:
 *
 *   1. Browser-level (refresh / tab close): a beforeunload listener that
 *      triggers the native browser "Changes you made may not be saved"
 *      dialog. Custom modals cannot intercept tab close, so this is the
 *      only reliable safety net for that case.
 *
 *   2. SPA-level (sidebar links, breadcrumbs, programmatic navigate):
 *      React Router's useBlocker intercepts cross-pathname navigation
 *      while the form is dirty. Instead of window.confirm, we render a
 *      Cytova-styled modal with three actions:
 *        - Stay on page    → blocker.reset()
 *        - Discard changes → consumer's onDiscard() + blocker.proceed()
 *        - Save and leave  → consumer's onSave() → proceed only on success
 *
 * Usage:
 *
 *   const { GuardModal } = useUnsavedChangesGuard({
 *     isDirty,
 *     onSave: async () => { ... return true on success, false on failure },
 *     onDiscard: () => reset(),
 *   })
 *   return <>{form}<GuardModal /></>
 *
 * The hook returns a render-helper component (``GuardModal``) rather than
 * rendering via Portal so the consumer remains in control of where the
 * dialog mounts. ``onSave`` is optional — wizards / unfinished-by-design
 * forms can omit it; the modal then offers only Stay + Discard.
 */
import { useCallback, useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Options {
  /** Whether the form has unsaved changes. Drives both layers. */
  isDirty: boolean
  /** Reset form to last saved values. Called when the user picks "Discard". */
  onDiscard: () => void
  /**
   * Persist the form. Called when the user picks "Save and leave".
   * Return ``true`` (or ``undefined``) to allow navigation to proceed,
   * ``false`` to keep the modal open (validation / server error).
   *
   * Omit entirely for forms that have no save-while-pending semantics
   * (e.g. multi-step create wizards) — the modal will only show
   * Stay + Discard in that case.
   */
  onSave?: () => Promise<boolean | void>
  /** Optional override for the modal description copy. */
  message?: string
}

interface GuardHandle {
  /**
   * Component to render anywhere inside the page tree. Reads the blocker
   * + saving state from the closure; consumer just slots ``<GuardModal />``
   * into their JSX once.
   */
  GuardModal: () => React.ReactElement | null
  /** Convenience boolean — true while the modal is open. */
  isBlocked: boolean
}

export function useUnsavedChangesGuard({
  isDirty,
  onDiscard,
  onSave,
  message,
}: Options): GuardHandle {
  const [saving, setSaving] = useState(false)

  // ----- Layer 1: browser-level (refresh / close tab) -----
  useEffect(() => {
    if (!isDirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      // Modern browsers ignore the message text and show generic copy;
      // the assignment is the legacy/cross-browser way to opt in.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  // ----- Layer 2: SPA navigation -----
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  const handleStay = useCallback(() => {
    blocker.reset?.()
  }, [blocker])

  const handleDiscard = useCallback(() => {
    onDiscard()
    blocker.proceed?.()
  }, [blocker, onDiscard])

  const handleSaveAndLeave = useCallback(async () => {
    if (!onSave) return
    setSaving(true)
    try {
      const result = await onSave()
      // Treat ``undefined`` return as success (the consumer just throws on
      // failure). Only ``false`` keeps the modal open.
      if (result !== false) {
        blocker.proceed?.()
      }
    } finally {
      setSaving(false)
    }
  }, [blocker, onSave])

  const GuardModal = useCallback(
    () => (
      <UnsavedChangesModal
        open={blocker.state === 'blocked'}
        saving={saving}
        message={message}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSaveAndLeave={onSave ? handleSaveAndLeave : undefined}
      />
    ),
    [blocker.state, saving, message, handleStay, handleDiscard, handleSaveAndLeave, onSave],
  )

  return { GuardModal, isBlocked: blocker.state === 'blocked' }
}


// ---------------------------------------------------------------------------
// Standalone modal component — exported so consumers can drive it manually
// in edge cases (e.g. testing or non-router-blocked confirmations). Most
// callers should reach for ``useUnsavedChangesGuard`` instead.
// ---------------------------------------------------------------------------

export function UnsavedChangesModal({
  open, saving, message, onStay, onDiscard, onSaveAndLeave,
}: {
  open: boolean
  saving: boolean
  message?: string
  onStay: () => void
  onDiscard: () => void
  onSaveAndLeave?: () => void
}) {
  return (
    <Dialog
      open={open}
      // Escape / outside-click is treated as "Stay" — the safest non-destructive
      // choice. Dialog calls onOpenChange(false) for those gestures.
      onOpenChange={(next) => { if (!next) onStay() }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle>Unsaved changes</DialogTitle>
              <DialogDescription>
                {message ?? 'You have unsaved changes. What would you like to do?'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/*
          UX order (left → right on desktop, primary action rightmost):
            Stay (ghost) · Discard (destructive) · Save and leave (primary blue)

          On narrow viewports flex-col-reverse stacks them top-to-bottom with
          the primary at the top — the standard mobile dialog convention.
        */}
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onStay} disabled={saving}>
            Stay on page
          </Button>
          <Button variant="destructive" onClick={onDiscard} disabled={saving}>
            Discard changes
          </Button>
          {onSaveAndLeave && (
            <Button onClick={onSaveAndLeave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save and leave
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
