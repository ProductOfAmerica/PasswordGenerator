import { describe, it, expect, vi } from 'vitest';
import {
  getRandomIndex,
  shuffleArray,
  generate,
  generatePassphrase,
  calculatePassphraseEntropy,
  scorePassword,
  checkPassStrength,
  checkPassphraseStrength,
  getColorForPercentage,
  CHAR_SETS,
} from '../password';
import { WORD_LIST } from '../wordlist';

// --- CSPRNG: getRandomIndex ---

describe('getRandomIndex', () => {
  it('returns values in [0, max) range', () => {
    for (let i = 0; i < 1000; i++) {
      const val = getRandomIndex(10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it('returns 0 when max is 1', () => {
    for (let i = 0; i < 100; i++) {
      expect(getRandomIndex(1)).toBe(0);
    }
  });

  it('returns 0 when max is 0 or negative', () => {
    expect(getRandomIndex(0)).toBe(0);
    expect(getRandomIndex(-5)).toBe(0);
  });

  it('produces a reasonable distribution (not all same value)', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 1000; i++) {
      const val = getRandomIndex(5);
      counts.set(val, (counts.get(val) || 0) + 1);
    }
    // All 5 values should appear at least once in 1000 tries
    expect(counts.size).toBe(5);
  });

  it('throws when crypto.getRandomValues is unavailable', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation(() => {
      throw new Error('not implemented');
    });
    // Temporarily override the check by mocking the property
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: undefined },
      configurable: true,
    });
    expect(() => getRandomIndex(10)).toThrow('crypto.getRandomValues is not available');
    // Restore
    if (original) {
      Object.defineProperty(globalThis, 'crypto', original);
    }
    spy.mockRestore();
  });
});

// --- shuffleArray ---

describe('shuffleArray', () => {
  it('returns array with same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray([...arr]);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('returns same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray([...arr])).toHaveLength(5);
  });
});

// --- generate ---

describe('generate', () => {
  it('generates a password of the correct length', () => {
    const pw = generate(16, 0, {
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSpecial: false,
    });
    expect(pw).toHaveLength(16);
  });

  it('respects uppercase-only option', () => {
    const pw = generate(20, 0, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toMatch(/^[A-Z]+$/);
  });

  it('respects lowercase-only option', () => {
    const pw = generate(20, 0, {
      useUppercase: false,
      useLowercase: true,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it('respects numbers-only option', () => {
    const pw = generate(20, 0, {
      useUppercase: false,
      useLowercase: false,
      useNumbers: true,
      useSpecial: false,
    });
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it('includes minimum numeric characters', () => {
    const pw = generate(20, 10, {
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSpecial: false,
    });
    const digitCount = (pw.match(/\d/g) || []).length;
    expect(digitCount).toBeGreaterThanOrEqual(10);
  });

  it('clamps length to minimum of 1', () => {
    const pw = generate(0, 0, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toHaveLength(1);
  });

  it('clamps length to maximum of 128', () => {
    const pw = generate(500, 0, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toHaveLength(128);
  });

  it('clamps minNumeric to length when it exceeds length', () => {
    const pw = generate(5, 100, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: true,
      useSpecial: false,
    });
    expect(pw).toHaveLength(5);
  });

  it('returns error message when no options selected', () => {
    const pw = generate(16, 0, {
      useUppercase: false,
      useLowercase: false,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toBe('No options selected.');
  });

  it('generates length=1 password', () => {
    const pw = generate(1, 0, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: false,
      useSpecial: false,
    });
    expect(pw).toHaveLength(1);
    expect(pw).toMatch(/^[A-Z]$/);
  });

  it('only contains characters from selected sets', () => {
    const pw = generate(50, 0, {
      useUppercase: true,
      useLowercase: false,
      useNumbers: true,
      useSpecial: false,
    });
    const allowed = CHAR_SETS.upper + CHAR_SETS.numbers;
    for (const char of pw) {
      expect(allowed).toContain(char);
    }
  });
});

// --- generatePassphrase ---

describe('generatePassphrase', () => {
  it('generates correct number of words', () => {
    const phrase = generatePassphrase(4, '-');
    expect(phrase.split('-')).toHaveLength(4);
  });

  it('uses the specified separator', () => {
    const phrase = generatePassphrase(3, '.');
    expect(phrase.split('.')).toHaveLength(3);
  });

  it('uses words from the word list', () => {
    const phrase = generatePassphrase(5, '-');
    const words = phrase.split('-');
    for (const word of words) {
      expect(WORD_LIST).toContain(word);
    }
  });

  it('clamps wordCount to minimum of 1', () => {
    const phrase = generatePassphrase(0, '-');
    expect(phrase.split('-')).toHaveLength(1);
  });

  it('clamps wordCount to maximum of 20', () => {
    const phrase = generatePassphrase(100, '-');
    expect(phrase.split('-')).toHaveLength(20);
  });
});

// --- calculatePassphraseEntropy ---

describe('calculatePassphraseEntropy', () => {
  it('returns 44 bits for 4 words from 2048 list', () => {
    expect(calculatePassphraseEntropy(4, 2048)).toBe(44);
  });

  it('returns 66 bits for 6 words from 2048 list', () => {
    expect(calculatePassphraseEntropy(6, 2048)).toBe(66);
  });

  it('returns 0 for 0 words', () => {
    expect(calculatePassphraseEntropy(0)).toBe(0);
  });

  it('returns 0 for negative word count', () => {
    expect(calculatePassphraseEntropy(-1)).toBe(0);
  });

  it('uses actual WORD_LIST length by default', () => {
    const expected = 4 * Math.log2(WORD_LIST.length);
    expect(calculatePassphraseEntropy(4)).toBeCloseTo(expected);
  });
});

// --- scorePassword ---

describe('scorePassword', () => {
  it('returns 0 for null', () => {
    expect(scorePassword(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(scorePassword(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(scorePassword('')).toBe(0);
  });

  it('scores short simple password low', () => {
    expect(scorePassword('aaa')).toBeLessThan(30);
  });

  it('scores long mixed password high', () => {
    expect(scorePassword('aB3$xY9!mN2@pQ7&')).toBeGreaterThan(80);
  });

  it('rewards character variety', () => {
    const allLower = scorePassword('abcdefghij');
    const mixed = scorePassword('aBcD3f!hIj');
    expect(mixed).toBeGreaterThan(allLower!);
  });
});

// --- checkPassStrength ---

describe('checkPassStrength', () => {
  it('returns Abysmal for very weak passwords', () => {
    expect(checkPassStrength('a')).toBe('Abysmal');
  });

  it('returns Phenomenal for very strong passwords', () => {
    expect(checkPassStrength('aB3$xY9!mN2@pQ7&kL5#wR8^')).toBe('Phenomenal');
  });

  it('handles null gracefully', () => {
    expect(checkPassStrength(null)).toBe('Abysmal');
  });

  it('returns valid strength labels', () => {
    const validLabels = [
      'Abysmal',
      'Awful',
      'Poor',
      'Weak',
      'Limited',
      'Mediocre',
      'Fair',
      'Good',
      'Great',
      'Incredible',
      'Phenomenal',
    ];
    expect(validLabels).toContain(checkPassStrength('test123'));
  });
});

// --- checkPassphraseStrength ---

describe('checkPassphraseStrength', () => {
  it('returns Good for 44 bits (4 words from 2048)', () => {
    expect(checkPassphraseStrength(44)).toBe('Good');
  });

  it('returns Incredible for 66 bits (6 words from 2048)', () => {
    expect(checkPassphraseStrength(66)).toBe('Incredible');
  });

  it('returns Abysmal for very low entropy', () => {
    expect(checkPassphraseStrength(10)).toBe('Abysmal');
  });

  it('returns Phenomenal for 77+ bits', () => {
    expect(checkPassphraseStrength(77)).toBe('Phenomenal');
  });
});

// --- getColorForPercentage ---

describe('getColorForPercentage', () => {
  it('returns red for 0%', () => {
    expect(getColorForPercentage(0)).toBe('rgb(255,0,0)');
  });

  it('returns yellow for 50%', () => {
    expect(getColorForPercentage(0.5)).toBe('rgb(255,255,0)');
  });

  it('returns green for 100%', () => {
    expect(getColorForPercentage(1)).toBe('rgb(0,255,0)');
  });

  it('clamps values below 0', () => {
    expect(getColorForPercentage(-0.5)).toBe('rgb(255,0,0)');
  });

  it('clamps values above 1', () => {
    expect(getColorForPercentage(1.5)).toBe('rgb(0,255,0)');
  });

  it('returns an intermediate color for 25%', () => {
    const color = getColorForPercentage(0.25);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });
});

// --- Word list integrity ---

describe('WORD_LIST', () => {
  it('contains exactly 2048 words', () => {
    expect(WORD_LIST).toHaveLength(2048);
  });

  it('contains no duplicates', () => {
    const unique = new Set(WORD_LIST);
    expect(unique.size).toBe(WORD_LIST.length);
  });

  it('contains only lowercase words', () => {
    for (const word of WORD_LIST) {
      expect(word).toBe(word.toLowerCase());
    }
  });
});
