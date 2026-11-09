'use server';

import { accountCanPurchase, containsCardNumber } from 'tropical-nomads-shared';
import { readAccounts, saveDefaultBillingAddress, updateAccounts } from 'tropical-nomads-api/accounts';
import { commitPayment, commitPaymentMethod, type PaymentDraft } from 'tropical-nomads-api/payments';
import { currentAccountSub } from '../account/actions';
import type { PaymentNotice } from '../i18n/copy';

export interface PaymentActionResult {
  notice: PaymentNotice;
}

const privateKeys = new Set(['secret', 'password', 'cardNumber', 'cvc', 'cvv', 'pan']);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function noticeFrom(error: unknown): PaymentNotice {
  const message = error instanceof Error ? error.message : '';
  switch (message) {
    case 'billing address is required':
      return 'billing-required';
    case 'card number is not allowed':
    case 'account file contains a card number':
      return 'card-rejected';
    default:
      return 'cannot-pay';
  }
}

function rejected(formData: FormData): boolean {
  const values: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (privateKeys.has(key)) {
      return true;
    }
    if (typeof value === 'string') {
      values.push(value);
    }
  }
  return containsCardNumber(values);
}

async function buyer(): Promise<{ sub: string; role: 'user'; actorId: string } | PaymentNotice> {
  const sub = await currentAccountSub();
  if (!sub) {
    return 'not-signed-in';
  }
  const profile = readAccounts().profiles.find((item) => item.sub === sub);
  if (!profile || !accountCanPurchase(profile)) {
    return profile ? 'cannot-pay' : 'not-signed-in';
  }
  return { sub, role: 'user', actorId: sub };
}

function bounded(value: string, max = 80): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length > max) {
    return undefined;
  }
  return trimmed;
}

export async function saveBillingAction(formData: FormData): Promise<PaymentActionResult> {
  if (rejected(formData)) {
    return { notice: 'card-rejected' };
  }
  const actor = await buyer();
  if (typeof actor === 'string') {
    return { notice: actor };
  }
  const address = {
    recipientName: bounded(field(formData, 'recipientName')),
    line1: bounded(field(formData, 'line1')),
    line2: bounded(field(formData, 'line2'), 80) ?? '',
    city: bounded(field(formData, 'city')),
    region: bounded(field(formData, 'region')),
    postalCode: bounded(field(formData, 'postalCode')),
    country: bounded(field(formData, 'country')),
  };
  if (!address.recipientName || !address.line1 || !address.city || !address.region || !address.postalCode || !address.country) {
    return { notice: 'billing-required' };
  }
  try {
    await updateAccounts((current) =>
      saveDefaultBillingAddress(
        current,
        actor.sub,
        {
          recipientName: address.recipientName,
          line1: address.line1,
          ...(address.line2 ? { line2: address.line2 } : {}),
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          country: address.country,
        },
        new Date().toISOString(),
      ),
    );
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
  return { notice: 'billing-saved' };
}

export async function saveMethodAction(formData: FormData): Promise<PaymentActionResult> {
  if (rejected(formData)) {
    return { notice: 'card-rejected' };
  }
  const actor = await buyer();
  if (typeof actor === 'string') {
    return { notice: actor };
  }
  try {
    await commitPaymentMethod(actor, actor.sub, {
      type: field(formData, 'type'),
      brand: field(formData, 'brand'),
      last4: field(formData, 'last4'),
      expiryMonth: field(formData, 'expiryMonth'),
      expiryYear: field(formData, 'expiryYear'),
    });
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
  return { notice: 'method-saved' };
}

export async function startTicketPaymentAction(formData: FormData): Promise<PaymentActionResult> {
  return startPurpose('tickets', formData);
}

export async function startShopPaymentAction(formData: FormData): Promise<PaymentActionResult> {
  return startPurpose('shop', formData);
}

async function startPurpose(purpose: 'tickets' | 'shop', formData: FormData): Promise<PaymentActionResult> {
  if (rejected(formData)) {
    return { notice: 'card-rejected' };
  }
  const actor = await buyer();
  if (typeof actor === 'string') {
    return { notice: actor };
  }
  const status = field(formData, 'status');
  const input: PaymentDraft = {
    userId: actor.sub,
    amount: Number(field(formData, 'amount')),
    currency: field(formData, 'currency'),
    reference: field(formData, 'reference'),
    ...(status ? { status } : {}),
  };
  try {
    const trace = await commitPayment(purpose, input, actor);
    if (trace.status !== 'pending_provider') {
      return { notice: 'cannot-pay' };
    }
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
  return { notice: 'pending-provider' };
}
