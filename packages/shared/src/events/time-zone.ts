/** An IANA zone `Intl` will accept. A city name such as Dublin is not a zone. */
export function knownTimeZone(value: string | undefined): string | undefined {
  const zone = value?.trim() ?? '';
  if (zone === '') {
    return undefined;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}
