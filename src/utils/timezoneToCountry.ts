/**
 * Utilitaire pour mapper les timezone_offset vers des pays et drapeaux
 *
 * Le timezone_offset est calculé comme: -new Date().getTimezoneOffset() / 60
 * Par exemple:
 * - France (UTC+1 en hiver, UTC+2 en été): 1 ou 2
 * - USA EST (UTC-5 en hiver, UTC-4 en été): -5 ou -4
 * - Tokyo (UTC+9): 9
 */

export interface CountryInfo {
  code: string; // Code ISO du pays (FR, US, JP, etc.)
  flag: string; // Emoji du drapeau
  name: string; // Nom du pays
}

/**
 * Mapping des timezone offsets vers les pays les plus probables
 * Note: Un offset peut correspondre à plusieurs pays, on choisit le plus représentatif
 * Mapping très détaillé avec plus de 40 zones horaires
 */
const TIMEZONE_TO_COUNTRY: Record<string, CountryInfo> = {
  // UTC-12 to UTC-11
  '-12': { code: 'UM', flag: '🇺🇲', name: 'US Minor Islands' },
  '-11': { code: 'AS', flag: '🇦🇸', name: 'American Samoa' },

  // UTC-10 to UTC-9 (Pacific)
  '-10': { code: 'US', flag: '🇺🇸', name: 'Hawaii' },
  '-9.5': { code: 'PF', flag: '🇵🇫', name: 'French Polynesia' },
  '-9': { code: 'US', flag: '🇺🇸', name: 'Alaska' },

  // UTC-8 to UTC-5 (Americas - West to East)
  '-8': { code: 'US', flag: '🇺🇸', name: 'Pacific Time' },
  '-7': { code: 'US', flag: '🇺🇸', name: 'Mountain Time' },
  '-6': { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  '-5': { code: 'US', flag: '🇺🇸', name: 'Eastern Time' },

  // UTC-4 to UTC-3 (South America)
  '-4': { code: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  '-3.5': { code: 'CA', flag: '🇨🇦', name: 'Newfoundland' },
  '-3': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  '-2': { code: 'BR', flag: '🇧🇷', name: 'Brazil' },

  // UTC-1 (Atlantic)
  '-1': { code: 'CV', flag: '🇨🇻', name: 'Cape Verde' },

  // UTC+0 (Western Europe & Africa)
  '0': { code: 'UNKNOWN', flag: '🏳️', name: 'Unknown' }, // Cas spécial pour timezone non défini

  // UTC+1 to UTC+2 (Europe)
  '1': { code: 'FR', flag: '🇫🇷', name: 'France' },
  '2': { code: 'DE', flag: '🇩🇪', name: 'Germany' }, // Europe centrale en été

  // UTC+3 (Eastern Europe & East Africa)
  '3': { code: 'RU', flag: '🇷🇺', name: 'Russia Moscow' },
  '3.5': { code: 'IR', flag: '🇮🇷', name: 'Iran' },

  // UTC+4 to UTC+5 (Middle East & Central Asia)
  '4': { code: 'AE', flag: '🇦🇪', name: 'UAE' },
  '4.5': { code: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  '5': { code: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  '5.5': { code: 'IN', flag: '🇮🇳', name: 'India' },
  '5.75': { code: 'NP', flag: '🇳🇵', name: 'Nepal' },

  // UTC+6 to UTC+7 (Asia)
  '6': { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  '6.5': { code: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  '7': { code: 'TH', flag: '🇹🇭', name: 'Thailand' },

  // UTC+8 to UTC+9 (East Asia)
  '8': { code: 'CN', flag: '🇨🇳', name: 'China' },
  '8.75': { code: 'AU', flag: '🇦🇺', name: 'Australia West' },
  '9': { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  '9.5': { code: 'AU', flag: '🇦🇺', name: 'Australia Central' },

  // UTC+10 to UTC+11 (Oceania)
  '10': { code: 'AU', flag: '🇦🇺', name: 'Australia East' },
  '10.5': { code: 'AU', flag: '🇦🇺', name: 'Lord Howe' },
  '11': { code: 'SB', flag: '🇸🇧', name: 'Solomon Islands' },

  // UTC+12 to UTC+13 (Far Pacific)
  '12': { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  '12.75': { code: 'NZ', flag: '🇳🇿', name: 'Chatham Islands' },
  '13': { code: 'TO', flag: '🇹🇴', name: 'Tonga' },
  '14': { code: 'KI', flag: '🇰🇮', name: 'Kiribati' },
};

/**
 * Obtient les informations du pays à partir du timezone offset
 */
export function getCountryFromTimezone(timezoneOffset: number | null | undefined): CountryInfo {
  if (timezoneOffset === null || timezoneOffset === undefined) {
    return { code: 'UNKNOWN', flag: '🏳️', name: 'Unknown' };
  }

  // Si timezone_offset = 0, c'est probablement un utilisateur qui n'a pas encore de timezone défini
  if (timezoneOffset === 0) {
    return TIMEZONE_TO_COUNTRY['0'];
  }

  const country = TIMEZONE_TO_COUNTRY[timezoneOffset.toString()];

  if (country) {
    return country;
  }

  // Fallback: si l'offset n'est pas dans la table, on retourne un drapeau neutre
  return { code: 'UNKNOWN', flag: '🏳️', name: 'Unknown' };
}

/**
 * Obtient juste le drapeau (version courte)
 */
export function getFlagFromTimezone(timezoneOffset: number | null | undefined): string {
  return getCountryFromTimezone(timezoneOffset).flag;
}

/**
 * Vérifie si deux utilisateurs sont du même pays (basé sur timezone)
 */
export function isSameCountry(offset1: number | null | undefined, offset2: number | null | undefined): boolean {
  if (!offset1 || !offset2) return false;
  return getCountryFromTimezone(offset1).code === getCountryFromTimezone(offset2).code;
}
