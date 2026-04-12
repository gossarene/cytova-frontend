import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { COUNTRIES, type Country } from '@/lib/data/countries'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { FlagIcon } from '@/components/shared/FlagIcon'

interface PhoneInputProps {
  /** Full phone value including dial code, e.g. "+225 07123456" */
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
}

/** Default dial code shown when no prefix is detected */
const DEFAULT_COUNTRY_CODE = 'ci'

/**
 * Parse an existing phone value into dial code + local number.
 * Matches the longest dial code prefix found in the dataset.
 */
function parsePhone(value: string): { country: Country | undefined; localNumber: string } {
  const trimmed = value.trim()
  if (!trimmed.startsWith('+')) {
    return { country: undefined, localNumber: trimmed }
  }

  let bestMatch: Country | undefined
  for (const c of COUNTRIES) {
    if (trimmed.startsWith(c.dial_code) && (!bestMatch || c.dial_code.length > bestMatch.dial_code.length)) {
      bestMatch = c
    }
  }

  if (bestMatch) {
    const local = trimmed.slice(bestMatch.dial_code.length).trimStart()
    return { country: bestMatch, localNumber: local }
  }

  return { country: undefined, localNumber: trimmed }
}

export function PhoneInput({
  value,
  onChange,
  id,
  placeholder = 'Phone number',
}: PhoneInputProps) {
  const parsed = useMemo(() => parsePhone(value), [value])

  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    () => parsed.country ?? COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE)
  )
  const [localNumber, setLocalNumber] = useState(parsed.localNumber)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function emitChange(country: Country | undefined, local: string) {
    const dial = country?.dial_code ?? ''
    const combined = local ? `${dial} ${local}`.trim() : ''
    onChange(combined)
  }

  function handleCountrySelect(country: Country) {
    setSelectedCountry(country)
    setOpen(false)
    emitChange(country, localNumber)
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocalNumber(v)
    emitChange(selectedCountry, v)
  }

  useEffect(() => {
    const p = parsePhone(value)
    if (p.country) setSelectedCountry(p.country)
    setLocalNumber(p.localNumber)
  }, [value])

  return (
    <div className="flex gap-0">
      {/* Dial code selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={triggerRef}
          type="button"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-l-lg rounded-r-none border border-r-0 border-input bg-transparent px-2 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {selectedCountry ? (
            <>
              <FlagIcon code={selectedCountry.code} />
              <span className="text-xs text-muted-foreground font-mono">{selectedCountry.dial_code}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">Code</span>
          )}
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country or code..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.dial_code} ${country.code}`}
                  data-checked={selectedCountry?.code === country.code || undefined}
                  onSelect={() => handleCountrySelect(country)}
                >
                  <FlagIcon code={country.code} />
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{country.dial_code}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Local number input */}
      <input
        id={id}
        type="tel"
        value={localNumber}
        onChange={handleLocalChange}
        placeholder={placeholder}
        className="flex h-8 w-full min-w-0 rounded-l-none rounded-r-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50"
      />
    </div>
  )
}
