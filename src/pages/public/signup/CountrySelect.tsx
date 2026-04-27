import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { COUNTRIES, getCountryByCode } from '@/lib/data/countries'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { FlagIcon } from '@/components/shared/FlagIcon'
import { cn } from '@/lib/utils'

interface CountrySelectProps {
  /** Stored value: ISO 3166-1 alpha-2 code, uppercase (e.g. "FR"). */
  value: string
  onChange: (code: string) => void
  invalid?: boolean
  id?: string
}

/**
 * Searchable country picker for the signup flow.
 *
 * The UI always displays a human-readable label (flag + country name).
 * The stored value is the uppercase ISO alpha-2 code so it matches the
 * backend serializer contract (`country: "FR"`).
 *
 * Backed by the shared COUNTRIES dataset to stay consistent with the rest
 * of the application; never hardcode the country list here.
 */
export function CountrySelect({ value, onChange, invalid, id }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = useState<number>()

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  // Dataset codes are lowercase; the form stores uppercase.
  const selected = value ? getCountryByCode(value.toLowerCase()) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        id={id}
        type="button"
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected ? (
            <>
              <FlagIcon code={selected.code} />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a country</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={triggerWidth ? { width: triggerWidth } : undefined}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {COUNTRIES.map((country) => (
              <CommandItem
                key={country.code}
                value={`${country.name} ${country.code}`}
                data-checked={selected?.code === country.code || undefined}
                onSelect={() => {
                  onChange(country.code.toUpperCase())
                  setOpen(false)
                }}
              >
                <FlagIcon code={country.code} />
                <span>{country.name}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
