import React, { useState, useEffect } from 'react';
import { COUNTRIES, detectCountryAndValidate, PhoneValidationResult, CountryPhoneInfo } from '../../lib/countryPhoneData';
import { Phone, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (formattedValue: string, result: PhoneValidationResult) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  label,
  placeholder = "Enter phone number...",
  required = false,
  disabled = false,
  className = "",
  showDetails = true,
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IN');
  const [validation, setValidation] = useState<PhoneValidationResult>(() =>
    detectCountryAndValidate(value || '', selectedCountryCode)
  );

  useEffect(() => {
    const res = detectCountryAndValidate(value || '', selectedCountryCode);
    setValidation(res);
    if (res.country.code !== selectedCountryCode && value.startsWith('+')) {
      setSelectedCountryCode(res.country.code);
    }
  }, [value, selectedCountryCode]);

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const countryObj = COUNTRIES.find(c => c.code === newCode);
    if (countryObj) {
      let rawDigits = value.replace(/\D/g, '');
      // If previous value had old dial code, strip it
      for (const c of COUNTRIES) {
        const d = c.dialCode.replace('+', '');
        if (rawDigits.startsWith(d)) {
          rawDigits = rawDigits.slice(d.length);
          break;
        }
      }
      const newValue = `${countryObj.dialCode} ${rawDigits}`;
      const res = detectCountryAndValidate(newValue, newCode);
      setValidation(res);
      onChange(newValue, res);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const res = detectCountryAndValidate(rawInput, selectedCountryCode);
    setValidation(res);
    onChange(rawInput, res);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>{validation.country.flag}</span>
            <span>{validation.country.name}</span>
          </span>
        </div>
      )}

      {/* Input Group with Country Selector */}
      <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition overflow-hidden">
        {/* Country Dial Code Dropdown */}
        <div className="relative flex items-center shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-2.5 py-2.5">
          <span className="text-sm mr-1">{validation.country.flag}</span>
          <select
            value={selectedCountryCode}
            onChange={handleCountrySelect}
            disabled={disabled}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {c.flag} {c.dialCode} ({c.name})
              </option>
            ))}
          </select>
        </div>

        {/* Number Input */}
        <div className="relative flex-1 flex items-center px-3">
          <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="tel"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder || `e.g. ${validation.country.dialCode} ${validation.country.example}`}
            disabled={disabled}
            required={required}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none py-2.5"
          />
          {value.trim().length > 0 && (
            <div className="ml-2 shrink-0">
              {validation.isValidLength ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Country & Digit Limit Badge Indicator */}
      {showDetails && (
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
              <Globe className="w-3 h-3 text-indigo-500" />
              {validation.country.flag} {validation.country.name} ({validation.country.dialCode})
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              📏 Allowed: <strong className="text-slate-900 dark:text-white">{validation.minDigits === validation.maxDigits ? `${validation.minDigits} digits` : `${validation.minDigits} - ${validation.maxDigits} digits`}</strong>
            </span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
              validation.isValidLength 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50' 
                : validation.digitCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              🔢 Entered: <strong className="font-extrabold">{validation.digitCount} digits</strong>
            </span>
          </div>

          {value.trim().length > 0 && (
            <span className={`text-[11px] font-bold ${
              validation.isValidLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {validation.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
