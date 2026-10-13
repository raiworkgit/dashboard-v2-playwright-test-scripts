export function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Regex source matching a number as the UI may render it: with or without
 * thousands separators (8418 or 8,418), and not followed by more digits.
 */
export function numPattern(n: number | string) {
  const value = Number(n);
  const digits = Math.abs(value).toLocaleString('en-US').replace(/,/g, ',?');
  return `${value < 0 ? '-' : ''}${digits}(?![\\d,])`;
}

/** Builds a regex from parts, allowing any whitespace between them. */
export function textSequence(...parts: string[]) {
  return new RegExp(parts.join('\\s*'));
}
