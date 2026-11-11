export const profileFieldOrder = ['givenName', 'familyName', 'displayName', 'phone', 'city', 'region', 'postalCode', 'country'] as const;

export type ProfileFieldName = (typeof profileFieldOrder)[number];

export type ProfileFieldIssue = 'required' | 'too-long' | 'phone';

export type ProfileFieldIssues = Partial<Record<ProfileFieldName, ProfileFieldIssue>>;

export type ProfileIssueCopyKey = 'givenNameRequired' | 'familyNameRequired' | 'profileValueTooLong' | 'phoneInvalid';

export interface ProfileFieldInput {
  givenName: string;
  familyName: string;
  displayName: string;
  phone: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export const profileFieldLimits: Record<ProfileFieldName, number> = {
  givenName: 80,
  familyName: 80,
  displayName: 80,
  phone: 16,
  city: 100,
  region: 100,
  postalCode: 24,
  country: 100,
};

const phonePattern = /^\+[1-9]\d{1,14}$/;

export function canonicalProfilePhone(value: string): string {
  return value.trim().replace(/[\s()-]/g, '');
}

export function profileInputFromFormData(formData: FormData): ProfileFieldInput {
  const text = (key: ProfileFieldName): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  };
  return {
    givenName: text('givenName'),
    familyName: text('familyName'),
    displayName: text('displayName'),
    phone: text('phone'),
    city: text('city'),
    region: text('region'),
    postalCode: text('postalCode'),
    country: text('country'),
  };
}

export function profileFieldIssues(input: ProfileFieldInput): ProfileFieldIssues {
  const issues: ProfileFieldIssues = {};
  const givenName = input.givenName.trim();
  const familyName = input.familyName.trim();
  if (givenName === '') {
    issues.givenName = 'required';
  } else if (givenName.length > profileFieldLimits.givenName) {
    issues.givenName = 'too-long';
  }
  if (familyName === '') {
    issues.familyName = 'required';
  } else if (familyName.length > profileFieldLimits.familyName) {
    issues.familyName = 'too-long';
  }
  for (const field of ['displayName', 'city', 'region', 'postalCode', 'country'] as const) {
    if (input[field].trim().length > profileFieldLimits[field]) {
      issues[field] = 'too-long';
    }
  }
  const phone = canonicalProfilePhone(input.phone);
  if (phone.length > profileFieldLimits.phone) {
    issues.phone = 'too-long';
  } else if (phone !== '' && !phonePattern.test(phone)) {
    issues.phone = 'phone';
  }
  return issues;
}

export function cleanedProfileInput(input: ProfileFieldInput): ProfileFieldInput {
  return {
    givenName: input.givenName.trim(),
    familyName: input.familyName.trim(),
    displayName: input.displayName.trim(),
    phone: canonicalProfilePhone(input.phone),
    city: input.city.trim(),
    region: input.region.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim(),
  };
}

export function firstProfileField(issues: ProfileFieldIssues): ProfileFieldName | undefined {
  return profileFieldOrder.find((field) => issues[field] !== undefined);
}

export function profileIssueCopyKey(field: ProfileFieldName, issue: ProfileFieldIssue): ProfileIssueCopyKey {
  switch (issue) {
    case 'required':
      switch (field) {
        case 'givenName':
          return 'givenNameRequired';
        case 'familyName':
          return 'familyNameRequired';
        case 'displayName':
        case 'phone':
        case 'city':
        case 'region':
        case 'postalCode':
        case 'country':
          return 'givenNameRequired';
        default: {
          const unexpectedField: never = field;
          return unexpectedField;
        }
      }
    case 'too-long':
      return 'profileValueTooLong';
    case 'phone':
      return 'phoneInvalid';
    default: {
      const unexpectedIssue: never = issue;
      return unexpectedIssue;
    }
  }
}
