import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Strong Password Generator',
    description:
      'Generate strong random passwords or memorable passphrases with CSPRNG. Customize length, character sets, and separators.',
    homepage_url: 'https://github.com/ProductOfAmerica/PasswordGenerator',
    permissions: ['storage'],
    icons: {
      16: '/icon/16.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
  },
});
