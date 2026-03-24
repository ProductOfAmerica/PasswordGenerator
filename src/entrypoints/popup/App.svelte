<script lang="ts">
  import {
    generate,
    generatePassphrase,
    scorePassword,
    checkPassStrengthFromScore,
    checkPassphraseStrength,
    calculatePassphraseEntropy,
    getColorForPercentage,
  } from '@/utils/password';
  import { DEFAULT_SETTINGS, STORAGE_KEY, type Settings } from '@/utils/defaults';

  // --- State ---
  let loaded = $state(false);
  let mode = $state<'random' | 'passphrase'>(DEFAULT_SETTINGS.mode);
  let numbersOfChars = $state(DEFAULT_SETTINGS.numbersOfChars);
  let minNumericChars = $state(DEFAULT_SETTINGS.minNumericChars);
  let useUppercase = $state(DEFAULT_SETTINGS.useUppercase);
  let useLowercase = $state(DEFAULT_SETTINGS.useLowercase);
  let useNumbers = $state(DEFAULT_SETTINGS.useNumbers);
  let useSpecial = $state(DEFAULT_SETTINGS.useSpecial);
  let wordCount = $state(DEFAULT_SETTINGS.wordCount);
  let separator = $state(DEFAULT_SETTINGS.separator);
  let randomPassword = $state('');
  let passphrasePassword = $state('');
  let password = $derived(mode === 'random' ? randomPassword : passphrasePassword);
  let toastVisible = $state(false);
  let toastMessage = $state('');
  let copied = $state(false);
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;
  let clipboardClearTimer: ReturnType<typeof setTimeout> | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let skipNextSave = false;

  // --- Derived ---
  let strengthScore = $derived(mode === 'random' ? scorePassword(password) : calculatePassphraseEntropy(wordCount));

  let strengthLabel = $derived(
    mode === 'random' ? checkPassStrengthFromScore(strengthScore) : checkPassphraseStrength(strengthScore),
  );

  let strengthPercentage = $derived(Math.min(strengthScore / (mode === 'random' ? 130 : 77), 1));

  let strengthColor = $derived(getColorForPercentage(strengthPercentage));

  // --- Functions ---
  function generateBoth() {
    randomPassword = generate(numbersOfChars, minNumericChars, {
      useUppercase,
      useLowercase,
      useNumbers,
      useSpecial,
    });
    passphrasePassword = generatePassphrase(wordCount, separator);
  }

  function generatePassword() {
    if (mode === 'random') {
      randomPassword = generate(numbersOfChars, minNumericChars, {
        useUppercase,
        useLowercase,
        useNumbers,
        useSpecial,
      });
    } else {
      passphrasePassword = generatePassphrase(wordCount, separator);
    }
  }

  function showToast(msg: string) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage = msg;
    toastVisible = true;
    toastTimer = setTimeout(() => {
      toastVisible = false;
    }, 1500);
  }

  async function copyToClipboard() {
    if (!password || password === 'No options selected.') return;
    try {
      await navigator.clipboard.writeText(password);
      showToast('Copied to clipboard');
      if (copiedTimer) clearTimeout(copiedTimer);
      copied = true;
      copiedTimer = setTimeout(() => {
        copied = false;
      }, 1500);

      if (clipboardClearTimer) clearTimeout(clipboardClearTimer);
      clipboardClearTimer = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch {
          /* popup may be closed */
        }
        clipboardClearTimer = null;
      }, 30_000);
    } catch {
      showToast('Failed to copy');
    }
  }

  function adjustValue(getter: () => number, setter: (v: number) => void, delta: number, min: number, max: number) {
    setter(Math.max(min, Math.min(max, getter() + delta)));
  }

  function handleTabKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newMode = mode === 'random' ? 'passphrase' : 'random';
      mode = newMode;
      document.getElementById(`tab-${newMode}`)?.focus();
    }
  }

  function getSettings(): Settings {
    return {
      mode,
      numbersOfChars,
      minNumericChars,
      useUppercase,
      useLowercase,
      useNumbers,
      useSpecial,
      wordCount,
      separator,
    };
  }

  function applySettings(s: Partial<Settings>) {
    if (s.mode === 'random' || s.mode === 'passphrase') mode = s.mode;
    if (typeof s.numbersOfChars === 'number') numbersOfChars = s.numbersOfChars;
    if (typeof s.minNumericChars === 'number') minNumericChars = s.minNumericChars;
    if (typeof s.useUppercase === 'boolean') useUppercase = s.useUppercase;
    if (typeof s.useLowercase === 'boolean') useLowercase = s.useLowercase;
    if (typeof s.useNumbers === 'boolean') useNumbers = s.useNumbers;
    if (typeof s.useSpecial === 'boolean') useSpecial = s.useSpecial;
    if (typeof s.wordCount === 'number') wordCount = s.wordCount;
    if (typeof s.separator === 'string') separator = s.separator;
  }

  // Load saved settings once on mount
  $effect(() => {
    try {
      chrome.storage.sync.get([STORAGE_KEY], (items) => {
        if (items[STORAGE_KEY]) {
          skipNextSave = true;
          applySettings(items[STORAGE_KEY]);
        }
        loaded = true;
        generateBoth();
      });
    } catch {
      loaded = true;
      generateBoth();
    }
  });

  // Persist settings on change
  $effect(() => {
    const settings = getSettings();
    if (!loaded) return;
    if (skipNextSave) {
      skipNextSave = false;
      return;
    }
    try {
      chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      // Storage unavailable (e.g. in test environments)
    }
  });

  // Cleanup timers on destroy
  $effect(() => {
    return () => {
      if (clipboardClearTimer) clearTimeout(clipboardClearTimer);
      if (toastTimer) clearTimeout(toastTimer);
      if (copiedTimer) clearTimeout(copiedTimer);
    };
  });
</script>

{#if !loaded}
  <main class="pw-layout" aria-hidden="true" style="visibility: hidden;"></main>
{:else}
  <main class="pw-layout">
    <!-- Title row -->
    <div class="pw-title-row">
      <img class="pw-title-icon" src="/icon/128.png" alt="" width="34" height="34" />
      <h1 class="pw-title">Strong Password Generator</h1>
    </div>

    <!-- Mode toggle -->
    <div class="pw-mode-track" role="tablist" aria-label="Password mode" tabindex="-1" onkeydown={handleTabKeydown}>
      <div class="pw-mode-indicator" style="left: {mode === 'random' ? '3px' : 'calc(50%)'};" aria-hidden="true"></div>
      <button
        class="pw-mode-btn {mode === 'random' ? 'active' : ''}"
        onclick={() => {
          mode = 'random';
        }}
        role="tab"
        id="tab-random"
        aria-selected={mode === 'random'}
        tabindex={mode === 'random' ? 0 : -1}>Random</button
      >
      <button
        class="pw-mode-btn {mode === 'passphrase' ? 'active' : ''}"
        onclick={() => {
          mode = 'passphrase';
        }}
        role="tab"
        id="tab-passphrase"
        aria-selected={mode === 'passphrase'}
        tabindex={mode === 'passphrase' ? 0 : -1}>Passphrase</button
      >
    </div>

    <!-- Password field -->
    <div>
      <div class="pw-field {copied ? 'pw-field-copied' : ''}">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="pw-field-inner" role="button" tabindex="-1" onclick={copyToClipboard}>
          <button
            class="pw-password-text"
            title="Click to copy"
            aria-live="polite"
            aria-label="Generated password. Click to copy."
          >
            {password || '...'}
          </button>
          {#if copied}
            <div class="pw-check-icon" aria-label="Copied">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          {:else}
            <button
              class="pw-regen-btn"
              onclick={(e) => {
                e.stopPropagation();
                generatePassword();
              }}
              aria-label="Regenerate password"
              title="Regenerate"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21.5 2v6h-6" />
                <path d="M2.5 22v-6h6" />
                <path d="M2.5 11.5a10 10 0 0 1 17.13-5.64L21.5 8" />
                <path d="M21.5 12.5a10 10 0 0 1-17.13 5.64L2.5 16" />
              </svg>
            </button>
          {/if}
        </div>
        <div
          class="pw-strength-field-bar"
          role="progressbar"
          aria-valuenow={Math.round(strengthPercentage * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Password strength: {strengthLabel}"
        >
          <div class="pw-strength-fill" style="width: {strengthPercentage * 100}%; background: {strengthColor};"></div>
        </div>
      </div>
      <div class="pw-meta">
        <span>Click to copy</span>
        {#if password && password !== 'No options selected.'}
          <span class="pw-strength-label" style="color: {strengthColor};">{strengthLabel}</span>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="pw-controls" role="tabpanel" aria-labelledby="tab-{mode}">
      {#if mode === 'random'}
        <div class="pw-row">
          <label class="pw-label" for="char-count">Characters</label>
          <div class="pw-num">
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => numbersOfChars,
                  (v) => (numbersOfChars = v),
                  -1,
                  1,
                  128,
                )}
              aria-label="Decrease character count">&#8722;</button
            >
            <input
              class="pw-num-input"
              id="char-count"
              type="number"
              bind:value={numbersOfChars}
              min="1"
              max="128"
              onchange={() => {
                numbersOfChars = Math.max(1, Math.min(128, numbersOfChars));
              }}
            />
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => numbersOfChars,
                  (v) => (numbersOfChars = v),
                  1,
                  1,
                  128,
                )}
              aria-label="Increase character count">+</button
            >
          </div>
        </div>

        <div class="pw-row">
          <label class="pw-label" for="min-nums">Min. numbers</label>
          <div class="pw-num">
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => minNumericChars,
                  (v) => (minNumericChars = v),
                  -1,
                  0,
                  numbersOfChars,
                )}
              aria-label="Decrease minimum number count">&#8722;</button
            >
            <input
              class="pw-num-input"
              id="min-nums"
              type="number"
              bind:value={minNumericChars}
              min="0"
              max={numbersOfChars}
              onchange={() => {
                minNumericChars = Math.max(0, Math.min(numbersOfChars, minNumericChars));
              }}
            />
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => minNumericChars,
                  (v) => (minNumericChars = v),
                  1,
                  0,
                  numbersOfChars,
                )}
              aria-label="Increase minimum number count">+</button
            >
          </div>
        </div>

        {#each [{ label: 'Uppercase', tag: 'A–Z', get: () => useUppercase, set: (v: boolean) => (useUppercase = v) }, { label: 'Lowercase', tag: 'a–z', get: () => useLowercase, set: (v: boolean) => (useLowercase = v) }, { label: 'Numbers', tag: '0–9', get: () => useNumbers, set: (v: boolean) => (useNumbers = v) }, { label: 'Symbols', tag: '!@#', get: () => useSpecial, set: (v: boolean) => (useSpecial = v) }] as opt}
          <button
            class="pw-row pw-toggle-row"
            onclick={() => opt.set(!opt.get())}
            role="switch"
            aria-checked={opt.get()}
          >
            <div class="pw-toggle-label-group">
              <span class="pw-label">{opt.label}</span>
              <span class="pw-tag">{opt.tag}</span>
            </div>
            <div class="pw-switch {opt.get() ? 'on' : ''}" aria-hidden="true">
              <div class="pw-switch-knob"></div>
            </div>
          </button>
        {/each}
      {:else}
        <div class="pw-row">
          <label class="pw-label" for="word-count">Words</label>
          <div class="pw-num">
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => wordCount,
                  (v) => (wordCount = v),
                  -1,
                  1,
                  20,
                )}
              aria-label="Decrease word count">&#8722;</button
            >
            <input
              class="pw-num-input"
              id="word-count"
              type="number"
              bind:value={wordCount}
              min="1"
              max="20"
              onchange={() => {
                wordCount = Math.max(1, Math.min(20, wordCount));
              }}
            />
            <button
              class="pw-num-btn"
              onclick={() =>
                adjustValue(
                  () => wordCount,
                  (v) => (wordCount = v),
                  1,
                  1,
                  20,
                )}
              aria-label="Increase word count">+</button
            >
          </div>
        </div>

        <div class="pw-row">
          <span class="pw-label">Separator</span>
          <div class="pw-sep-group">
            {#each ['-', '.', '_', ' '] as sep}
              <button
                class="pw-sep-btn {separator === sep ? 'active' : ''}"
                onclick={() => {
                  separator = sep;
                }}
                aria-label="Separator: {sep === ' ' ? 'space' : sep}"
                aria-pressed={separator === sep}
              >
                {sep === ' ' ? '␣' : sep}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Screen reader announcements -->
    <div aria-live="assertive" aria-atomic="true" class="sr-only">
      {toastVisible ? toastMessage : ''}
    </div>
  </main>
{/if}
