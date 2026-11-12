'use client';

import { useMemo } from 'react';
import { useLanguage } from '../../i18n/provider';
import { canonicalCountryName, countryChoices, countryCodeFromInput } from '../../shop/postal';
import { CountryMark } from './CountryMark';
import { SelectField } from './Select';

const flagClassName = 'h-3 w-4 shrink-0 rounded-[2px]';

export function CountrySelect({
  name,
  value,
  onChange,
  ariaLabel,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  className,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const { language } = useLanguage();
  const options = useMemo(
    () =>
      countryChoices(language).map((choice) => {
        const code = countryCodeFromInput(choice.value);
        return {
          value: choice.value,
          label: choice.label,
          ...(code ? { keywords: code, icon: <CountryMark flag={code} flagClassName={flagClassName} /> } : {}),
        };
      }),
    [language],
  );
  return (
    <SelectField
      name={name}
      ariaLabel={ariaLabel}
      value={canonicalCountryName(value)}
      placeholder={placeholder}
      searchable
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      onChange={onChange}
      options={options}
      className={className}
    />
  );
}
