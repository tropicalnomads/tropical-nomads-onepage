export function timeZoneChoices(): string[] {
  return Intl.supportedValuesOf('timeZone');
}
