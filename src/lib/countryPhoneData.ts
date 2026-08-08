export interface CountryPhoneInfo {
  name: string;
  code: string; // ISO 2 code
  dialCode: string; // e.g., "+91"
  minDigits: number;
  maxDigits: number;
  flag: string;
  example: string;
}

export const COUNTRIES: CountryPhoneInfo[] = [
  { name: 'India', code: 'IN', dialCode: '+91', minDigits: 10, maxDigits: 10, flag: '🇮🇳', example: '9876543210' },
  { name: 'United States', code: 'US', dialCode: '+1', minDigits: 10, maxDigits: 10, flag: '🇺🇸', example: '2025550123' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', minDigits: 10, maxDigits: 11, flag: '🇬🇧', example: '7911123456' },
  { name: 'Canada', code: 'CA', dialCode: '+1', minDigits: 10, maxDigits: 10, flag: '🇨🇦', example: '4165550123' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', minDigits: 9, maxDigits: 9, flag: '🇦🇪', example: '501234567' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', minDigits: 9, maxDigits: 9, flag: '🇸🇦', example: '501234567' },
  { name: 'Australia', code: 'AU', dialCode: '+61', minDigits: 9, maxDigits: 10, flag: '🇦🇺', example: '412345678' },
  { name: 'Germany', code: 'DE', dialCode: '+49', minDigits: 10, maxDigits: 11, flag: '🇩🇪', example: '15112345678' },
  { name: 'France', code: 'FR', dialCode: '+33', minDigits: 9, maxDigits: 9, flag: '🇫🇷', example: '612345678' },
  { name: 'Japan', code: 'JP', dialCode: '+81', minDigits: 10, maxDigits: 11, flag: '🇯🇵', example: '9012345678' },
  { name: 'China', code: 'CN', dialCode: '+86', minDigits: 11, maxDigits: 11, flag: '🇨🇳', example: '13812345678' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', minDigits: 8, maxDigits: 8, flag: '🇸🇬', example: '91234567' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', minDigits: 9, maxDigits: 10, flag: '🇲🇾', example: '123456789' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', minDigits: 10, maxDigits: 10, flag: '🇵🇰', example: '3001234567' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', minDigits: 10, maxDigits: 10, flag: '🇧🇩', example: '1712345678' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', minDigits: 10, maxDigits: 10, flag: '🇳🇬', example: '8021234567' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', minDigits: 9, maxDigits: 9, flag: '🇿🇦', example: '821234567' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', minDigits: 10, maxDigits: 11, flag: '🇧🇷', example: '11912345678' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', minDigits: 10, maxDigits: 10, flag: '🇲🇽', example: '5512345678' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', minDigits: 10, maxDigits: 10, flag: '🇵🇭', example: '9171234567' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', minDigits: 9, maxDigits: 12, flag: '🇮🇩', example: '81234567890' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', minDigits: 9, maxDigits: 10, flag: '🇻🇳', example: '901234567' },
  { name: 'Italy', code: 'IT', dialCode: '+39', minDigits: 9, maxDigits: 10, flag: '🇮🇹', example: '3123456789' },
  { name: 'Spain', code: 'ES', dialCode: '+34', minDigits: 9, maxDigits: 9, flag: '🇪🇸', example: '612345678' },
  { name: 'Russia', code: 'RU', dialCode: '+7', minDigits: 10, maxDigits: 10, flag: '🇷🇺', example: '9123456789' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', minDigits: 10, maxDigits: 10, flag: '🇹🇷', example: '5123456789' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', minDigits: 9, maxDigits: 9, flag: '🇰🇪', example: '712345678' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', minDigits: 10, maxDigits: 10, flag: '🇪🇬', example: '1012345678' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', minDigits: 9, maxDigits: 11, flag: '🇰🇷', example: '1012345678' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', minDigits: 10, maxDigits: 10, flag: '🇳🇵', example: '9841234567' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', minDigits: 9, maxDigits: 9, flag: '🇱🇰', example: '771234567' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', minDigits: 8, maxDigits: 8, flag: '🇶🇦', example: '55123456' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', minDigits: 8, maxDigits: 8, flag: '🇰🇼', example: '91234567' },
  { name: 'Oman', code: 'OM', dialCode: '+968', minDigits: 8, maxDigits: 8, flag: '🇴🇲', example: '91234567' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', minDigits: 8, maxDigits: 8, flag: '🇧🇭', example: '39123456' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', minDigits: 9, maxDigits: 9, flag: '🇮🇪', example: '871234567' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', minDigits: 9, maxDigits: 9, flag: '🇳🇱', example: '612345678' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', minDigits: 8, maxDigits: 10, flag: '🇳🇿', example: '211234567' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', minDigits: 10, maxDigits: 11, flag: '🇦🇷', example: '91112345678' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', minDigits: 10, maxDigits: 10, flag: '🇨🇴', example: '3001234567' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India (+91) as initial default or US

export interface PhoneValidationResult {
  country: CountryPhoneInfo;
  dialCode: string;
  subscriberDigits: string; // digits after dial code or total digits
  digitCount: number;
  minDigits: number;
  maxDigits: number;
  isValidLength: boolean;
  isTooShort: boolean;
  isTooLong: boolean;
  message: string;
}

// Helper to sort dial codes by length descending so longer prefixes (+880, +971) match before (+8, +9)
const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

export function detectCountryAndValidate(input: string, overrideCountryCode?: string): PhoneValidationResult {
  const clean = input.trim();
  const digitsOnly = clean.replace(/\D/g, '');

  let matchedCountry: CountryPhoneInfo | undefined;
  let dialCode = '';
  let subscriberDigits = digitsOnly;

  // If explicit override country selected by user
  if (overrideCountryCode) {
    matchedCountry = COUNTRIES.find(c => c.code === overrideCountryCode);
  }

  // If input starts with +, try matching dial code
  if (clean.startsWith('+')) {
    for (const c of sortedCountries) {
      const codeDigits = c.dialCode.replace('+', '');
      if (digitsOnly.startsWith(codeDigits)) {
        matchedCountry = c;
        dialCode = c.dialCode;
        subscriberDigits = digitsOnly.slice(codeDigits.length);
        break;
      }
    }
  } else {
    // Check if input starts with dial code digits (e.g. 919876543210 or 12025550123)
    if (!matchedCountry) {
      for (const c of sortedCountries) {
        const codeDigits = c.dialCode.replace('+', '');
        if (digitsOnly.startsWith(codeDigits) && digitsOnly.length > codeDigits.length + 4) {
          matchedCountry = c;
          dialCode = c.dialCode;
          subscriberDigits = digitsOnly.slice(codeDigits.length);
          break;
        }
      }
    }
  }

  // Fallback if country couldn't be auto-detected
  if (!matchedCountry) {
    matchedCountry = DEFAULT_COUNTRY;
    dialCode = DEFAULT_COUNTRY.dialCode;
    subscriberDigits = digitsOnly;
  }

  const count = subscriberDigits.length;
  const minDigits = matchedCountry.minDigits;
  const maxDigits = matchedCountry.maxDigits;

  const isValidLength = count >= minDigits && count <= maxDigits;
  const isTooShort = count < minDigits;
  const isTooLong = count > maxDigits;

  let message = '';
  if (count === 0) {
    message = `Required: ${minDigits === maxDigits ? `${minDigits} digits` : `${minDigits}-${maxDigits} digits`} for ${matchedCountry.name}`;
  } else if (isValidLength) {
    message = `✓ Valid phone number for ${matchedCountry.name} (${count} digits)`;
  } else if (isTooShort) {
    const needed = minDigits - count;
    message = `⚠️ Too short for ${matchedCountry.name}: ${count} digits entered (Minimum is ${minDigits} digits, enter ${needed} more)`;
  } else {
    const extra = count - maxDigits;
    message = `⚠️ Exceeds limit for ${matchedCountry.name}: ${count} digits entered (Maximum allowed is ${maxDigits} digits, remove ${extra})`;
  }

  return {
    country: matchedCountry,
    dialCode,
    subscriberDigits,
    digitCount: count,
    minDigits,
    maxDigits,
    isValidLength,
    isTooShort,
    isTooLong,
    message,
  };
}
