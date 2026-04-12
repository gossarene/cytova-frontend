import { useState, useRef, useEffect } from 'react'
import { ChevronsUpDown, User } from 'lucide-react'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { usePatients } from '@/modules/patients/api'

interface PatientComboboxProps {
  /** Selected patient ID */
  value: string
  /** Display name for the selected patient (avoids extra lookup when known) */
  displayName?: string
  onChange: (patientId: string, patientName: string) => void
  onClear?: () => void
  placeholder?: string
}

export function PatientCombobox({
  value,
  displayName,
  onChange,
  onClear,
  placeholder = 'All patients',
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = useState<number>()

  const { data: patientsData } = usePatients(
    open ? { search: search || undefined, is_active: 'true' } : {},
  )
  const patients = patientsData?.data ?? []

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <span className="flex items-center gap-2 truncate text-sm">
          {value ? (
            <>
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{displayName || 'Patient'}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={triggerWidth ? { width: Math.max(triggerWidth, 280) } : { width: 280 }}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search patient..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            {value && (
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onClear?.()
                  onChange('', '')
                  setOpen(false)
                }}
                className="text-muted-foreground"
              >
                Show all patients
              </CommandItem>
            )}
            {patients.map((p) => (
              <CommandItem
                key={p.id}
                value={p.id}
                data-checked={p.id === value || undefined}
                onSelect={() => {
                  onChange(p.id, p.full_name)
                  setOpen(false)
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.document_number}</span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
