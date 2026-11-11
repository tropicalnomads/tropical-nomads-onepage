'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveBillingAction, saveMethodAction, type PaymentActionResult } from '../payments/actions';
import { accountText, paymentNotice, paymentPurposeLabel, paymentText, paymentTypeLabel } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { SelectField } from './SelectField';
import { Button } from './ui/Button';
import { fieldControlClass } from './ui/field';

const fieldClass = `${fieldControlClass} mt-1 text-sm`;

const methodTypes = ['card', 'apple_pay', 'google_pay', 'other'] as const;

export interface SavedMethod {
  id: string;
  type: (typeof methodTypes)[number];
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PendingTrace {
  id: string;
  amount: number;
  currency: string;
  purpose: 'tickets' | 'shop';
}

export interface BillingSummary {
  recipientName: string;
  country: string;
}

function Notice({ notice }: { notice: PaymentActionResult['notice'] | null }) {
  const { language } = useLanguage();
  if (!notice) {
    return null;
  }
  return (
    <p role="status" className="mt-4 text-sm text-ozora-yellow">
      {paymentNotice(language, notice)}
    </p>
  );
}

export function PaymentSection({
  canPay,
  billing,
  methods,
  traces,
}: {
  canPay: boolean;
  billing: BillingSummary | null;
  methods: readonly SavedMethod[];
  traces: readonly PendingTrace[];
}) {
  const { language } = useLanguage();
  const router = useRouter();
  const [notice, setNotice] = useState<PaymentActionResult['notice'] | null>(null);

  async function onBilling(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await saveBillingAction(new FormData(event.currentTarget));
    setNotice(result.notice);
    if (result.notice === 'billing-saved') {
      router.refresh();
    }
  }

  async function onMethod(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await saveMethodAction(new FormData(event.currentTarget));
    setNotice(result.notice);
    if (result.notice === 'method-saved') {
      router.refresh();
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ozora-cream">{paymentText(language, 'section')}</h2>
      <p className="mt-2 text-sm text-ozora-cream/70">{paymentText(language, 'notACharge')}</p>
      {methods.length === 0 ? <p className="mt-4 text-sm text-ozora-cream/70">{accountText(language, 'noPaymentMethod')}</p> : null}
      {methods.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ozora-cream">
          {methods.map((method) => (
            <li key={method.id}>
              {paymentTypeLabel(language, method.type)} {method.brand} ···· {method.last4} {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
            </li>
          ))}
        </ul>
      ) : null}
      {traces.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ozora-cream/80">
          {traces.map((trace) => (
            <li key={trace.id}>
              {paymentPurposeLabel(language, trace.purpose)} {trace.amount} {trace.currency} · {paymentText(language, 'pending')}
            </li>
          ))}
        </ul>
      ) : null}
      {canPay && !billing ? (
        <form onSubmit={onBilling} className="mt-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-ozora-cream">{paymentText(language, 'billingTitle')}</h3>
          <AddressField name="recipientName" label={paymentText(language, 'recipientName')} autoComplete="name" />
          <AddressField name="line1" label={paymentText(language, 'line1')} autoComplete="address-line1" />
          <AddressField name="line2" label={paymentText(language, 'line2')} autoComplete="address-line2" />
          <AddressField name="city" label={paymentText(language, 'city')} autoComplete="address-level2" />
          <AddressField name="region" label={paymentText(language, 'region')} autoComplete="address-level1" />
          <AddressField name="postalCode" label={paymentText(language, 'postalCode')} autoComplete="postal-code" />
          <AddressField name="country" label={paymentText(language, 'country')} autoComplete="country-name" />
          <Button type="submit">
            {paymentText(language, 'saveBilling')}
          </Button>
        </form>
      ) : null}
      {billing ? (
        <p className="mt-4 text-sm text-ozora-cream/80">
          {paymentText(language, 'billingSaved')} {billing.recipientName}, {billing.country}
        </p>
      ) : null}
      {canPay && billing ? (
        <form onSubmit={onMethod} className="mt-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-ozora-cream">{paymentText(language, 'methodTitle')}</h3>
          <label className="block text-sm text-ozora-cream/80">
            {paymentText(language, 'type')}
            <SelectField
              name="type"
              className="mt-1"
              ariaLabel={paymentText(language, 'type')}
              defaultValue="card"
              options={methodTypes.map((type) => ({ value: type, label: paymentTypeLabel(language, type) }))}
            />
          </label>
          <AddressField name="brand" label={paymentText(language, 'brand')} autoComplete="off" />
          <AddressField name="last4" label={paymentText(language, 'last4')} autoComplete="off" maxLength={4} />
          <AddressField name="expiryMonth" label={paymentText(language, 'expiryMonth')} autoComplete="off" maxLength={2} />
          <AddressField name="expiryYear" label={paymentText(language, 'expiryYear')} autoComplete="off" maxLength={4} />
          <Button type="submit">
            {paymentText(language, 'saveMethod')}
          </Button>
        </form>
      ) : null}
      <Notice notice={notice} />
    </section>
  );
}

function AddressField({ name, label, autoComplete, maxLength }: { name: string; label: string; autoComplete: string; maxLength?: number }) {
  return (
    <label className="block text-sm text-ozora-cream/80">
      {label}
      <input name={name} type="text" autoComplete={autoComplete} maxLength={maxLength} className={fieldClass} />
    </label>
  );
}
