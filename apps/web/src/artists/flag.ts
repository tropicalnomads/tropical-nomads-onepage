export function isoCountryCode(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const chars = Array.from(trimmed);
  if (chars.length !== 2) {
    return undefined;
  }
  const letters = chars.map((char) => {
    const point = char.codePointAt(0);
    if (point === undefined || point < 0x1f1e6 || point > 0x1f1ff) {
      return undefined;
    }
    return point - 0x1f1e6 + 65;
  });
  const first = letters[0];
  const second = letters[1];
  if (first === undefined || second === undefined) {
    return undefined;
  }
  return String.fromCharCode(first, second);
}

export function countryCaption(country: string | undefined, code: string | undefined): string | undefined {
  const name = country?.trim() ?? '';
  if (name === '') {
    return undefined;
  }
  const asCode = isoCountryCode(name);
  if (asCode && (code === undefined || asCode === code)) {
    return undefined;
  }
  return name;
}
