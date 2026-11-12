export const artistGenres = [
  'Forest',
  'Full-On',
  'Full-On Groove',
  'Melodic',
  'Morning',
  'Night',
  'Progressive',
  'Progressive Psytrance',
  'Psytrance',
  'Twilight',
] as const;

export const artistGenreLimit = 12;

const knownGenres = new Set<string>(artistGenres);

export function genreChoices(selected: readonly string[]): string[] {
  const extras = selected.filter((genre) => !knownGenres.has(genre));
  return [...artistGenres, ...extras];
}

export function toggleArtistGenre(selected: readonly string[], genre: string): string[] {
  if (selected.includes(genre)) {
    return selected.filter((item) => item !== genre);
  }
  if (selected.length >= artistGenreLimit) {
    return [...selected];
  }
  return [...selected, genre];
}
