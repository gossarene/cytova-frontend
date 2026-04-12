import { useState, useRef, useEffect } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { COUNTRIES, getCountryByName, type Country } from '@/lib/data/countries'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { FlagIcon } from '@/components/shared/FlagIcon'

interface CountryComboboxProps {
  /** Country name (the stored value) */
  value: string
  onChange: (name: string) => void
  placeholder?: string
  id?: string
}

export function CountryCombobox({
  value,
  onChange,
  placeholder = 'Select country...',
  id,
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = useState<number>()

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const selected: Country | undefined = value ? getCountryByName(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        id={id}
        type="button"
        className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50"
        data-placeholder={!selected ? '' : undefined}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <FlagIcon code={selected.code} />
              <span>{selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
                  onChange(country.name)
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
