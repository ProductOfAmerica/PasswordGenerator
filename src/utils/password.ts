import { WORD_LIST } from './wordlist';

// --- Character sets ---

export const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '-!$%^&*(#)@_+|~=`\\]{}[":;\'<>?,./',
} as const;

// --- CSPRNG utilities ---

/**
 * Returns a cryptographically secure random integer in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 */
export function getRandomIndex(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('crypto.getRandomValues is not available. Cannot generate secure random values.');
  }
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max; // largest multiple of max within Uint32 range
  let value: number;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % max;
}

/** Fisher-Yates shuffle using CSPRNG. Mutates and returns the array. */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Password generation ---

export interface GenerateOptions {
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSpecial: boolean;
}

/**
 * Generates a random password using CSPRNG.
 * Returns the password string, or an error message if no character sets are enabled.
 */
export function generate(length: number, minNumeric: number, options: GenerateOptions): string {
  // Clamp inputs
  length = Math.max(1, Math.min(128, Math.floor(length) || 1));
  minNumeric = Math.max(0, Math.min(length, Math.floor(minNumeric) || 0));

  // Build available character pool
  let pool = '';
  if (options.useUppercase) pool += CHAR_SETS.upper;
  if (options.useLowercase) pool += CHAR_SETS.lower;
  if (options.useNumbers) pool += CHAR_SETS.numbers;
  if (options.useSpecial) pool += CHAR_SETS.special;

  if (pool.length === 0) return 'No options selected.';

  // Generate password characters
  const password: string[] = Array.from({ length }, () => pool[getRandomIndex(pool.length)]);

  // Ensure minimum numeric characters
  if (options.useNumbers) {
    for (let i = 0; i < minNumeric; i++) {
      password[i] = CHAR_SETS.numbers[getRandomIndex(CHAR_SETS.numbers.length)];
    }
  }

  return shuffleArray(password).join('');
}

// --- Passphrase generation ---

/**
 * Generates a passphrase from the word list using CSPRNG.
 */
export function generatePassphrase(wordCount: number, separator: string): string {
  wordCount = Math.max(1, Math.min(20, Math.floor(wordCount) || 1));
  const words: string[] = Array.from({ length: wordCount }, () => WORD_LIST[getRandomIndex(WORD_LIST.length)]);
  return words.join(separator);
}

/**
 * Calculates entropy in bits for a passphrase.
 * entropy = log2(wordlistSize ^ wordCount) = wordCount * log2(wordlistSize)
 */
export function calculatePassphraseEntropy(wordCount: number, wordlistSize: number = WORD_LIST.length): number {
  if (wordCount <= 0 || wordlistSize <= 0) return 0;
  return wordCount * Math.log2(wordlistSize);
}

// --- Password scoring ---

/** Scores a password based on length, uniqueness, and character variety. */
export function scorePassword(pass: string | null | undefined): number {
  if (!pass) return 0;

  const letters: Record<string, number> = {};
  let score = 0;

  for (const char of pass) {
    letters[char] = (letters[char] || 0) + 1;
    score += 5.0 / letters[char];
  }

  const variations = {
    digits: /\d/.test(pass),
    lower: /[a-z]/.test(pass),
    upper: /[A-Z]/.test(pass),
    nonWords: /\W/.test(pass),
  };
  const variationCount = Object.values(variations).filter(Boolean).length;

  return Math.floor(score + (variationCount - 1) * 10);
}

/** Maps a password score to a human-readable strength label. */
export function checkPassStrength(password: string | null | undefined): string {
  return checkPassStrengthFromScore(scorePassword(password));
}

/** Maps a pre-computed score to a human-readable strength label. */
export function checkPassStrengthFromScore(score: number): string {
  if (score > 130) return 'Phenomenal';
  if (score > 90) return 'Incredible';
  if (score > 80) return 'Great';
  if (score > 69) return 'Good';
  if (score > 54) return 'Fair';
  if (score > 44) return 'Mediocre';
  if (score > 38) return 'Limited';
  if (score > 34) return 'Weak';
  if (score > 29) return 'Poor';
  if (score > 19) return 'Awful';
  return 'Abysmal';
}

/** Maps passphrase entropy (bits) to a strength label. */
export function checkPassphraseStrength(entropyBits: number): string {
  if (entropyBits >= 77) return 'Phenomenal';
  if (entropyBits >= 66) return 'Incredible';
  if (entropyBits >= 55) return 'Great';
  if (entropyBits >= 44) return 'Good';
  if (entropyBits >= 33) return 'Fair';
  if (entropyBits >= 22) return 'Weak';
  return 'Abysmal';
}

// --- Color utilities ---

const PERCENT_COLORS = [
  { pct: 0.0, color: { r: 255, g: 0, b: 0 } },
  { pct: 0.5, color: { r: 255, g: 255, b: 0 } },
  { pct: 1.0, color: { r: 0, g: 255, b: 0 } },
];

/** Interpolates between red → yellow → green based on a 0–1 percentage. */
export function getColorForPercentage(pct: number): string {
  pct = Math.max(0, Math.min(1, pct));
  let lower = PERCENT_COLORS[0];
  let upper = PERCENT_COLORS[PERCENT_COLORS.length - 1];

  for (let i = 1; i < PERCENT_COLORS.length; i++) {
    if (pct < PERCENT_COLORS[i].pct) {
      lower = PERCENT_COLORS[i - 1];
      upper = PERCENT_COLORS[i];
      break;
    }
  }

  const rangePct = (pct - lower.pct) / (upper.pct - lower.pct);
  const pctLower = 1 - rangePct;
  const pctUpper = rangePct;

  const r = Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper);
  const g = Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper);
  const b = Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper);

  return `rgb(${r},${g},${b})`;
}
