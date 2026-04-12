/**
 * Country dataset for nationality and phone dial code selectors.
 *
 * Covers Africa (comprehensive), Europe, Americas, Middle East, and major
 * Asian countries. Sorted alphabetically by name.
 *
 * Flags are rendered via the `flag-icons` CSS library using the ISO alpha-2
 * code (class="fi fi-{code}"). No emoji fallback needed.
 */

export interface Country {
  code: string      // ISO 3166-1 alpha-2 (lowercase used for flag-icons CSS class)
  name: string      // English country name
  dial_code: string // E.164 dial code (e.g. "+225")
}

export const COUNTRIES: Country[] = [
  { code: 'dz', name: 'Algeria', dial_code: '+213' },
  { code: 'ao', name: 'Angola', dial_code: '+244' },
  { code: 'ar', name: 'Argentina', dial_code: '+54' },
  { code: 'au', name: 'Australia', dial_code: '+61' },
  { code: 'at', name: 'Austria', dial_code: '+43' },
  { code: 'be', name: 'Belgium', dial_code: '+32' },
  { code: 'bj', name: 'Benin', dial_code: '+229' },
  { code: 'bw', name: 'Botswana', dial_code: '+267' },
  { code: 'br', name: 'Brazil', dial_code: '+55' },
  { code: 'bf', name: 'Burkina Faso', dial_code: '+226' },
  { code: 'bi', name: 'Burundi', dial_code: '+257' },
  { code: 'cm', name: 'Cameroon', dial_code: '+237' },
  { code: 'ca', name: 'Canada', dial_code: '+1' },
  { code: 'cv', name: 'Cape Verde', dial_code: '+238' },
  { code: 'cf', name: 'Central African Republic', dial_code: '+236' },
  { code: 'td', name: 'Chad', dial_code: '+235' },
  { code: 'cn', name: 'China', dial_code: '+86' },
  { code: 'co', name: 'Colombia', dial_code: '+57' },
  { code: 'km', name: 'Comoros', dial_code: '+269' },
  { code: 'cg', name: 'Congo', dial_code: '+242' },
  { code: 'cd', name: 'Congo (DRC)', dial_code: '+243' },
  { code: 'ci', name: "C\u00f4te d'Ivoire", dial_code: '+225' },
  { code: 'hr', name: 'Croatia', dial_code: '+385' },
  { code: 'cz', name: 'Czech Republic', dial_code: '+420' },
  { code: 'dk', name: 'Denmark', dial_code: '+45' },
  { code: 'dj', name: 'Djibouti', dial_code: '+253' },
  { code: 'eg', name: 'Egypt', dial_code: '+20' },
  { code: 'gq', name: 'Equatorial Guinea', dial_code: '+240' },
  { code: 'er', name: 'Eritrea', dial_code: '+291' },
  { code: 'et', name: 'Ethiopia', dial_code: '+251' },
  { code: 'fi', name: 'Finland', dial_code: '+358' },
  { code: 'fr', name: 'France', dial_code: '+33' },
  { code: 'ga', name: 'Gabon', dial_code: '+241' },
  { code: 'gm', name: 'Gambia', dial_code: '+220' },
  { code: 'de', name: 'Germany', dial_code: '+49' },
  { code: 'gh', name: 'Ghana', dial_code: '+233' },
  { code: 'gr', name: 'Greece', dial_code: '+30' },
  { code: 'gn', name: 'Guinea', dial_code: '+224' },
  { code: 'gw', name: 'Guinea-Bissau', dial_code: '+245' },
  { code: 'in', name: 'India', dial_code: '+91' },
  { code: 'ie', name: 'Ireland', dial_code: '+353' },
  { code: 'il', name: 'Israel', dial_code: '+972' },
  { code: 'it', name: 'Italy', dial_code: '+39' },
  { code: 'jp', name: 'Japan', dial_code: '+81' },
  { code: 'ke', name: 'Kenya', dial_code: '+254' },
  { code: 'lr', name: 'Liberia', dial_code: '+231' },
  { code: 'ly', name: 'Libya', dial_code: '+218' },
  { code: 'mg', name: 'Madagascar', dial_code: '+261' },
  { code: 'mw', name: 'Malawi', dial_code: '+265' },
  { code: 'ml', name: 'Mali', dial_code: '+223' },
  { code: 'mr', name: 'Mauritania', dial_code: '+222' },
  { code: 'mu', name: 'Mauritius', dial_code: '+230' },
  { code: 'mx', name: 'Mexico', dial_code: '+52' },
  { code: 'ma', name: 'Morocco', dial_code: '+212' },
  { code: 'mz', name: 'Mozambique', dial_code: '+258' },
  { code: 'na', name: 'Namibia', dial_code: '+264' },
  { code: 'nl', name: 'Netherlands', dial_code: '+31' },
  { code: 'ne', name: 'Niger', dial_code: '+227' },
  { code: 'ng', name: 'Nigeria', dial_code: '+234' },
  { code: 'no', name: 'Norway', dial_code: '+47' },
  { code: 'pl', name: 'Poland', dial_code: '+48' },
  { code: 'pt', name: 'Portugal', dial_code: '+351' },
  { code: 'ro', name: 'Romania', dial_code: '+40' },
  { code: 'rw', name: 'Rwanda', dial_code: '+250' },
  { code: 'sa', name: 'Saudi Arabia', dial_code: '+966' },
  { code: 'sn', name: 'Senegal', dial_code: '+221' },
  { code: 'sl', name: 'Sierra Leone', dial_code: '+232' },
  { code: 'za', name: 'South Africa', dial_code: '+27' },
  { code: 'kr', name: 'South Korea', dial_code: '+82' },
  { code: 'es', name: 'Spain', dial_code: '+34' },
  { code: 'sd', name: 'Sudan', dial_code: '+249' },
  { code: 'se', name: 'Sweden', dial_code: '+46' },
  { code: 'ch', name: 'Switzerland', dial_code: '+41' },
  { code: 'tz', name: 'Tanzania', dial_code: '+255' },
  { code: 'tg', name: 'Togo', dial_code: '+228' },
  { code: 'tn', name: 'Tunisia', dial_code: '+216' },
  { code: 'tr', name: 'Turkey', dial_code: '+90' },
  { code: 'ug', name: 'Uganda', dial_code: '+256' },
  { code: 'ae', name: 'United Arab Emirates', dial_code: '+971' },
  { code: 'gb', name: 'United Kingdom', dial_code: '+44' },
  { code: 'us', name: 'United States', dial_code: '+1' },
  { code: 'zm', name: 'Zambia', dial_code: '+260' },
  { code: 'zw', name: 'Zimbabwe', dial_code: '+263' },
]

/** Lookup helpers */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toLowerCase())
}

export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase())
}
