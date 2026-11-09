import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { paymentNotice, paymentText, shellCopy, type PaymentNotice } from '../src/i18n/copy.ts';

const notices: PaymentNotice[] = ['not-signed-in', 'billing-required', 'card-rejected', 'billing-saved', 'method-saved', 'cannot-pay', 'pending-provider'];

describe('payment interfaces', () => {
  it('keeps the card number off the account screen and leaves the current shop links', () => {
    const form = readFileSync(new URL('../src/components/PaymentSection.tsx', import.meta.url), 'utf8');
    const account = readFileSync(new URL('../src/components/AccountHome.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/payments/actions.ts', import.meta.url), 'utf8');
    const upcoming = readFileSync(new URL('../app/upcoming-events/page.tsx', import.meta.url), 'utf8');
    const shop = readFileSync(new URL('../../one-pager/src/lib/shop.ts', import.meta.url), 'utf8');
    const onePagerList = readFileSync(new URL('../../one-pager/src/lib/data.ts', import.meta.url), 'utf8');
    assert.equal(form.includes('cardNumber'), false);
    assert.equal(form.includes('cvc'), false);
    assert.equal(form.includes('cc-number'), false);
    assert.equal(account.includes('PaymentSection'), false);
    assert.equal(actions.includes('markPaymentConfirmed'), false);
    assert.equal(actions.includes('recordRefund'), false);
    assert.equal(actions.includes('startTicketPaymentAction'), true);
    assert.equal(actions.includes('startShopPaymentAction'), true);
    assert.equal(actions.includes("startPurpose('tickets'"), true);
    assert.equal(actions.includes("startPurpose('shop'"), true);
    assert.equal(actions.includes('commitPayment'), true);
    assert.equal(upcoming.includes('commitPayment'), false);
    assert.equal(shop.includes('whatsappReserveUrl'), true);
    assert.equal(shop.includes('SHOP_PRICE_EUR'), true);
    assert.equal(onePagerList.includes('getPrimaryTicketUrl'), true);
    for (const language of locales) {
      assert.equal(paymentText(language, 'notACharge').includes('http'), false);
      for (const notice of notices) {
        assert.equal(paymentNotice(language, notice).trim().length > 0, true);
      }
      assert.equal(shellCopy[language].payments.types.card.trim().length > 0, true);
    }
  });
});
