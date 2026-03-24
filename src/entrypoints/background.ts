import { DEFAULT_SETTINGS, STORAGE_KEY } from '@/utils/defaults';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    chrome.storage.sync.get([STORAGE_KEY], (items) => {
      if (!items[STORAGE_KEY]) {
        chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
      }
    });

    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }
  });
});
