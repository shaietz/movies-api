export const GENRES = [
  'action',
  'adventure',
  'animation',
  'comedy',
  'crime',
  'documentary',
  'drama',
  'family',
  'fantasy',
  'history',
  'horror',
  'music',
  'mystery',
  'romance',
  'sci-fi',
  'thriller',
  'war',
  'western',
] as const;
export type Genre = (typeof GENRES)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export const FIRST_FILM_YEAR = 1888;
