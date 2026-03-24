export interface Settings {
  mode: 'random' | 'passphrase';
  numbersOfChars: number;
  minNumericChars: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSpecial: boolean;
  wordCount: number;
  separator: string;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'random',
  numbersOfChars: 16,
  minNumericChars: 5,
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  useSpecial: true,
  wordCount: 4,
  separator: '-',
};

export const STORAGE_KEY = 'strongPassGenerator';
