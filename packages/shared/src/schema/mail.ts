import {
  fail,
  finish,
  isRecord,
  optionalString,
  readRecord,
  rejectSensitive,
  rejectUnknown,
  requireString,
  type ParseResult,
} from './result.ts';
import {
  consentSubjects,
  locales,
  marketingFor,
  parseEnum,
  requireRef,
  templateIds,
  type ConsentSubject,
  type Locale,
  type SchemaRefs,
  type TemplateId,
} from './values.ts';

export interface MarketingConsent {
  id: string;
  subjectKind: ConsentSubject;
  subjectId: string;
  purpose: string;
  consentedAt: string;
  stoppedAt?: string;
  stopToken: string;
}

export interface EmailTemplate {
  id: TemplateId;
  purpose: string;
  marketing: boolean;
  subject: { en: string; pt: string };
  body: { en: string; pt: string };
}

export interface EmailSend {
  id: string;
  templateId: TemplateId;
  recipient: string;
  language: Locale;
  purpose: string;
  at: string;
}

export interface OutsideParty {
  id: string;
  name: string;
}

export interface ArtistOffer {
  id: string;
  outsidePartyId: string;
  artistId: string;
  sendId?: string;
}

function parseLocalized(value: unknown, field: string, errors: string[]): { en: string; pt: string } | undefined {
  if (!isRecord(value)) {
    errors.push(`${field} needs en and pt`);
    return undefined;
  }
  rejectUnknown(value, ['en', 'pt'], errors);
  const en = requireString(value, 'en', errors);
  const pt = requireString(value, 'pt', errors);
  if (!en || !pt) return undefined;
  return { en, pt };
}

export function parseMarketingConsent(input: unknown, refs: SchemaRefs = {}): ParseResult<MarketingConsent> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'subjectKind', 'subjectId', 'purpose', 'consentedAt', 'stoppedAt', 'stopToken'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const subjectKind = parseEnum(read.value.subjectKind, consentSubjects, 'subjectKind');
  if (!subjectKind.ok) errors.push(...subjectKind.errors);
  const subjectId = requireString(read.value, 'subjectId', errors);
  const purpose = requireString(read.value, 'purpose', errors);
  const consentedAt = requireString(read.value, 'consentedAt', errors);
  const stoppedAt = optionalString(read.value, 'stoppedAt', errors);
  const stopToken = requireString(read.value, 'stopToken', errors);
  if (subjectKind.ok && subjectKind.value === 'account' && subjectId) {
    requireRef(refs.profileIds, subjectId, 'subjectId', errors);
  }
  if (subjectKind.ok && subjectKind.value === 'outsideParty' && subjectId) {
    requireRef(refs.outsidePartyIds, subjectId, 'subjectId', errors);
  }
  if (stopToken && stopToken.length < 16) errors.push('stopToken is too short');
  if (stopToken && subjectId && stopToken === subjectId) errors.push('stopToken must not be the subject id');
  if (stopToken && refs.publicPartyIds?.includes(stopToken)) errors.push('stopToken must not be a public party id');
  if (!id || !subjectKind.ok || !subjectId || !purpose || !consentedAt || !stopToken) return fail(errors);
  const consent: MarketingConsent = { id, subjectKind: subjectKind.value, subjectId, purpose, consentedAt, stopToken };
  if (stoppedAt) consent.stoppedAt = stoppedAt;
  return finish(errors, consent);
}

export function parseEmailTemplate(input: unknown): ParseResult<EmailTemplate> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'purpose', 'marketing', 'subject', 'body'], errors);
  rejectSensitive(read.value, errors);
  const id = parseEnum(read.value.id, templateIds, 'id');
  if (!id.ok) errors.push(...id.errors);
  const purpose = requireString(read.value, 'purpose', errors);
  if (typeof read.value.marketing !== 'boolean') errors.push('marketing is required');
  if (id.ok && typeof read.value.marketing === 'boolean' && read.value.marketing !== marketingFor(id.value)) {
    errors.push('marketing does not match the template');
  }
  const subject = parseLocalized(read.value.subject, 'subject', errors);
  const body = parseLocalized(read.value.body, 'body', errors);
  if (!id.ok || !purpose || typeof read.value.marketing !== 'boolean' || !subject || !body) return fail(errors);
  return finish(errors, { id: id.value, purpose, marketing: read.value.marketing, subject, body });
}

export function parseEmailSend(input: unknown, refs: SchemaRefs = {}): ParseResult<EmailSend> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'templateId', 'recipient', 'language', 'purpose', 'at'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const templateId = parseEnum(read.value.templateId, templateIds, 'templateId');
  if (!templateId.ok) errors.push(...templateId.errors);
  if (templateId.ok) requireRef(refs.templateIds, templateId.value, 'templateId', errors);
  const recipient = requireString(read.value, 'recipient', errors);
  if (recipient && !recipient.includes('@')) errors.push('recipient is not an email');
  const language = parseEnum(read.value.language, locales, 'language');
  if (!language.ok) errors.push(...language.errors);
  const purpose = requireString(read.value, 'purpose', errors);
  const at = requireString(read.value, 'at', errors);
  if (!id || !templateId.ok || !recipient || !language.ok || !purpose || !at) return fail(errors);
  return finish(errors, { id, templateId: templateId.value, recipient, language: language.value, purpose, at });
}

export function parseOutsideParty(input: unknown, refs: SchemaRefs = {}): ParseResult<OutsideParty> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'name'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const name = requireString(read.value, 'name', errors);
  if (id && refs.publicPartyIds?.includes(id)) errors.push('outside party id is a public party id');
  if (!id || !name) return fail(errors);
  return finish(errors, { id, name });
}

export function parseArtistOffer(input: unknown, refs: SchemaRefs = {}): ParseResult<ArtistOffer> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'outsidePartyId', 'artistId', 'sendId'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const outsidePartyId = requireString(read.value, 'outsidePartyId', errors);
  const artistId = requireString(read.value, 'artistId', errors);
  const sendId = optionalString(read.value, 'sendId', errors);
  if (artistId) requireRef(refs.artistIds, artistId, 'artistId', errors);
  if (outsidePartyId) {
    requireRef(refs.outsidePartyIds, outsidePartyId, 'outsidePartyId', errors);
    if (refs.publicPartyIds?.includes(outsidePartyId)) errors.push('outsidePartyId is a public party id');
  }
  if (!id || !outsidePartyId || !artistId) return fail(errors);
  const offer: ArtistOffer = { id, outsidePartyId, artistId };
  if (sendId) offer.sendId = sendId;
  return finish(errors, offer);
}
