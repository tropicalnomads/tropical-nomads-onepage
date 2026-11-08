import { parseProfile, type Profile } from './account.ts';
import { parseStockCount, type StockCount } from './commerce.ts';
import { parseMarketingConsent, type MarketingConsent } from './mail.ts';
import { fail, ok, type ParseResult } from './result.ts';

function rejectDuplicate<T>(rows: readonly T[], keyOf: (row: T) => string, label: string): ParseResult<readonly T[]> {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) {
      return fail(`duplicate ${label}`);
    }
    seen.add(key);
  }
  return ok(rows);
}

export function parseProfiles(inputs: readonly unknown[]): ParseResult<readonly Profile[]> {
  const profiles: Profile[] = [];
  const errors: string[] = [];
  for (const input of inputs) {
    const parsed = parseProfile(input);
    if (!parsed.ok) errors.push(...parsed.errors);
    else profiles.push(parsed.value);
  }
  if (errors.length > 0) return fail(errors);
  const username = rejectDuplicate(profiles, (profile) => profile.username, 'username');
  if (!username.ok) return username;
  const email = rejectDuplicate(profiles, (profile) => profile.email, 'email');
  if (!email.ok) return email;
  const sub = rejectDuplicate(profiles, (profile) => profile.sub, 'sub');
  if (!sub.ok) return sub;
  const providerSubjects = profiles.flatMap((profile) =>
    profile.providers.map((link) => `${link.provider}:${link.subject}`),
  );
  return rejectDuplicate(providerSubjects, (key) => key, 'provider subject').ok ? ok(profiles) : fail('duplicate provider subject');
}

export function parseStockCounts(inputs: readonly unknown[]): ParseResult<readonly StockCount[]> {
  const rows: StockCount[] = [];
  const errors: string[] = [];
  for (const input of inputs) {
    const parsed = parseStockCount(input);
    if (!parsed.ok) errors.push(...parsed.errors);
    else rows.push(parsed.value);
  }
  if (errors.length > 0) return fail(errors);
  return rejectDuplicate(rows, (row) => `${row.productId}:${row.size}`, 'stock');
}

export function parseConsents(inputs: readonly unknown[]): ParseResult<readonly MarketingConsent[]> {
  const rows: MarketingConsent[] = [];
  const errors: string[] = [];
  for (const input of inputs) {
    const parsed = parseMarketingConsent(input);
    if (!parsed.ok) errors.push(...parsed.errors);
    else rows.push(parsed.value);
  }
  if (errors.length > 0) return fail(errors);
  const subject = rejectDuplicate(rows, (row) => `${row.subjectKind}:${row.subjectId}`, 'consent subject');
  if (!subject.ok) return subject;
  return rejectDuplicate(rows, (row) => row.stopToken, 'stopToken');
}
