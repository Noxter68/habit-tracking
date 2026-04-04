/**
 * Utilitaire pour mapper les timezones vers des pays et drapeaux
 *
 * Utilise en priorité le nom IANA du timezone (ex: 'Europe/Paris')
 * qui est fiable indépendamment du changement d'heure été/hiver.
 * Fallback sur le timezone_offset pour les anciens profils.
 */

export interface CountryInfo {
  code: string; // Code ISO du pays (FR, US, JP, etc.)
  flag: string; // Emoji du drapeau
  name: string; // Nom du pays
}

const UNKNOWN_COUNTRY: CountryInfo = { code: 'UNKNOWN', flag: '🏳️', name: 'Unknown' };

/**
 * Mapping des noms IANA de timezone vers les pays
 */
const IANA_TO_COUNTRY: Record<string, CountryInfo> = {
  // France
  'Europe/Paris': { code: 'FR', flag: '🇫🇷', name: 'France' },

  // Germany
  'Europe/Berlin': { code: 'DE', flag: '🇩🇪', name: 'Germany' },

  // UK
  'Europe/London': { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },

  // Spain
  'Europe/Madrid': { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  'Atlantic/Canary': { code: 'ES', flag: '🇪🇸', name: 'Spain' },

  // Italy
  'Europe/Rome': { code: 'IT', flag: '🇮🇹', name: 'Italy' },

  // Portugal
  'Europe/Lisbon': { code: 'PT', flag: '🇵🇹', name: 'Portugal' },
  'Atlantic/Azores': { code: 'PT', flag: '🇵🇹', name: 'Portugal' },

  // Belgium
  'Europe/Brussels': { code: 'BE', flag: '🇧🇪', name: 'Belgium' },

  // Netherlands
  'Europe/Amsterdam': { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },

  // Switzerland
  'Europe/Zurich': { code: 'CH', flag: '🇨🇭', name: 'Switzerland' },

  // Austria
  'Europe/Vienna': { code: 'AT', flag: '🇦🇹', name: 'Austria' },

  // Poland
  'Europe/Warsaw': { code: 'PL', flag: '🇵🇱', name: 'Poland' },

  // Sweden
  'Europe/Stockholm': { code: 'SE', flag: '🇸🇪', name: 'Sweden' },

  // Norway
  'Europe/Oslo': { code: 'NO', flag: '🇳🇴', name: 'Norway' },

  // Denmark
  'Europe/Copenhagen': { code: 'DK', flag: '🇩🇰', name: 'Denmark' },

  // Finland
  'Europe/Helsinki': { code: 'FI', flag: '🇫🇮', name: 'Finland' },

  // Ireland
  'Europe/Dublin': { code: 'IE', flag: '🇮🇪', name: 'Ireland' },

  // Greece
  'Europe/Athens': { code: 'GR', flag: '🇬🇷', name: 'Greece' },

  // Czech Republic
  'Europe/Prague': { code: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },

  // Romania
  'Europe/Bucharest': { code: 'RO', flag: '🇷🇴', name: 'Romania' },

  // Hungary
  'Europe/Budapest': { code: 'HU', flag: '🇭🇺', name: 'Hungary' },

  // Turkey
  'Europe/Istanbul': { code: 'TR', flag: '🇹🇷', name: 'Turkey' },

  // Russia
  'Europe/Moscow': { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  'Europe/Kaliningrad': { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  'Asia/Yekaterinburg': { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  'Asia/Vladivostok': { code: 'RU', flag: '🇷🇺', name: 'Russia' },

  // Ukraine
  'Europe/Kyiv': { code: 'UA', flag: '🇺🇦', name: 'Ukraine' },

  // USA
  'America/New_York': { code: 'US', flag: '🇺🇸', name: 'Eastern Time' },
  'America/Chicago': { code: 'US', flag: '🇺🇸', name: 'Central Time' },
  'America/Denver': { code: 'US', flag: '🇺🇸', name: 'Mountain Time' },
  'America/Los_Angeles': { code: 'US', flag: '🇺🇸', name: 'Pacific Time' },
  'America/Anchorage': { code: 'US', flag: '🇺🇸', name: 'Alaska' },
  'Pacific/Honolulu': { code: 'US', flag: '🇺🇸', name: 'Hawaii' },
  'America/Phoenix': { code: 'US', flag: '🇺🇸', name: 'Arizona' },

  // Canada
  'America/Toronto': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'America/Vancouver': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'America/Edmonton': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'America/Winnipeg': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'America/Halifax': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'America/St_Johns': { code: 'CA', flag: '🇨🇦', name: 'Canada' },

  // Mexico
  'America/Mexico_City': { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  'America/Cancun': { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  'America/Tijuana': { code: 'MX', flag: '🇲🇽', name: 'Mexico' },

  // Brazil
  'America/Sao_Paulo': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  'America/Manaus': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },

  // Argentina
  'America/Argentina/Buenos_Aires': { code: 'AR', flag: '🇦🇷', name: 'Argentina' },

  // Colombia
  'America/Bogota': { code: 'CO', flag: '🇨🇴', name: 'Colombia' },

  // Chile
  'America/Santiago': { code: 'CL', flag: '🇨🇱', name: 'Chile' },

  // Japan
  'Asia/Tokyo': { code: 'JP', flag: '🇯🇵', name: 'Japan' },

  // South Korea
  'Asia/Seoul': { code: 'KR', flag: '🇰🇷', name: 'South Korea' },

  // China
  'Asia/Shanghai': { code: 'CN', flag: '🇨🇳', name: 'China' },
  'Asia/Hong_Kong': { code: 'HK', flag: '🇭🇰', name: 'Hong Kong' },

  // Taiwan
  'Asia/Taipei': { code: 'TW', flag: '🇹🇼', name: 'Taiwan' },

  // India
  'Asia/Kolkata': { code: 'IN', flag: '🇮🇳', name: 'India' },
  'Asia/Calcutta': { code: 'IN', flag: '🇮🇳', name: 'India' },

  // Thailand
  'Asia/Bangkok': { code: 'TH', flag: '🇹🇭', name: 'Thailand' },

  // Vietnam
  'Asia/Ho_Chi_Minh': { code: 'VN', flag: '🇻🇳', name: 'Vietnam' },

  // Singapore
  'Asia/Singapore': { code: 'SG', flag: '🇸🇬', name: 'Singapore' },

  // Indonesia
  'Asia/Jakarta': { code: 'ID', flag: '🇮🇩', name: 'Indonesia' },

  // Philippines
  'Asia/Manila': { code: 'PH', flag: '🇵🇭', name: 'Philippines' },

  // Malaysia
  'Asia/Kuala_Lumpur': { code: 'MY', flag: '🇲🇾', name: 'Malaysia' },

  // UAE
  'Asia/Dubai': { code: 'AE', flag: '🇦🇪', name: 'UAE' },

  // Saudi Arabia
  'Asia/Riyadh': { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },

  // Israel
  'Asia/Jerusalem': { code: 'IL', flag: '🇮🇱', name: 'Israel' },

  // Pakistan
  'Asia/Karachi': { code: 'PK', flag: '🇵🇰', name: 'Pakistan' },

  // Iran
  'Asia/Tehran': { code: 'IR', flag: '🇮🇷', name: 'Iran' },

  // Australia
  'Australia/Sydney': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'Australia/Melbourne': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'Australia/Brisbane': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'Australia/Perth': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'Australia/Adelaide': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'Australia/Darwin': { code: 'AU', flag: '🇦🇺', name: 'Australia' },

  // New Zealand
  'Pacific/Auckland': { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' },

  // South Africa
  'Africa/Johannesburg': { code: 'ZA', flag: '🇿🇦', name: 'South Africa' },

  // Egypt
  'Africa/Cairo': { code: 'EG', flag: '🇪🇬', name: 'Egypt' },

  // Nigeria
  'Africa/Lagos': { code: 'NG', flag: '🇳🇬', name: 'Nigeria' },

  // Morocco
  'Africa/Casablanca': { code: 'MA', flag: '🇲🇦', name: 'Morocco' },

  // Kenya
  'Africa/Nairobi': { code: 'KE', flag: '🇰🇪', name: 'Kenya' },
};

/**
 * Fallback: mapping des timezone offsets (pour les anciens profils sans timezone_name)
 */
const OFFSET_TO_COUNTRY: Record<string, CountryInfo> = {
  '-12': { code: 'UM', flag: '🇺🇲', name: 'US Minor Islands' },
  '-11': { code: 'AS', flag: '🇦🇸', name: 'American Samoa' },
  '-10': { code: 'US', flag: '🇺🇸', name: 'Hawaii' },
  '-9': { code: 'US', flag: '🇺🇸', name: 'Alaska' },
  '-8': { code: 'US', flag: '🇺🇸', name: 'Pacific Time' },
  '-7': { code: 'US', flag: '🇺🇸', name: 'Mountain Time' },
  '-6': { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  '-5': { code: 'US', flag: '🇺🇸', name: 'Eastern Time' },
  '-4': { code: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  '-3': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  '-2': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  '-1': { code: 'CV', flag: '🇨🇻', name: 'Cape Verde' },
  '0': UNKNOWN_COUNTRY,
  '1': { code: 'FR', flag: '🇫🇷', name: 'France' },
  '2': { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  '3': { code: 'RU', flag: '🇷🇺', name: 'Russia Moscow' },
  '4': { code: 'AE', flag: '🇦🇪', name: 'UAE' },
  '5': { code: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  '5.5': { code: 'IN', flag: '🇮🇳', name: 'India' },
  '6': { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  '7': { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
  '8': { code: 'CN', flag: '🇨🇳', name: 'China' },
  '9': { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  '10': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  '11': { code: 'SB', flag: '🇸🇧', name: 'Solomon Islands' },
  '12': { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  '13': { code: 'TO', flag: '🇹🇴', name: 'Tonga' },
};

/**
 * Obtient les informations du pays à partir du timezone IANA name
 */
export function getCountryFromTimezoneName(timezoneName: string | null | undefined): CountryInfo | null {
  if (!timezoneName) return null;
  return IANA_TO_COUNTRY[timezoneName] || null;
}

/**
 * Obtient les informations du pays à partir du timezone offset (fallback)
 */
export function getCountryFromTimezoneOffset(timezoneOffset: number | null | undefined): CountryInfo {
  if (timezoneOffset === null || timezoneOffset === undefined) {
    return UNKNOWN_COUNTRY;
  }
  return OFFSET_TO_COUNTRY[timezoneOffset.toString()] || UNKNOWN_COUNTRY;
}

/**
 * Obtient les informations du pays - utilise timezone_name en priorité, fallback sur offset
 */
export function getCountryFromTimezone(
  timezoneOffset: number | null | undefined,
  timezoneName?: string | null
): CountryInfo {
  // Priorité au nom IANA (fiable indépendamment du DST)
  const fromName = getCountryFromTimezoneName(timezoneName);
  if (fromName) return fromName;

  // Fallback sur l'offset
  return getCountryFromTimezoneOffset(timezoneOffset);
}

/**
 * Obtient juste le drapeau (version courte)
 */
export function getFlagFromTimezone(
  timezoneOffset: number | null | undefined,
  timezoneName?: string | null
): string {
  return getCountryFromTimezone(timezoneOffset, timezoneName).flag;
}

/**
 * Vérifie si deux utilisateurs sont du même pays (basé sur timezone)
 */
export function isSameCountry(
  offset1: number | null | undefined,
  offset2: number | null | undefined,
  name1?: string | null,
  name2?: string | null
): boolean {
  const country1 = getCountryFromTimezone(offset1, name1);
  const country2 = getCountryFromTimezone(offset2, name2);
  if (country1.code === 'UNKNOWN' || country2.code === 'UNKNOWN') return false;
  return country1.code === country2.code;
}

/**
 * Récupère le nom IANA du timezone du device
 */
export function getDeviceTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
