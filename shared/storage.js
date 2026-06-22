"use strict";

const CHATPINS_STORAGE_KEY = "pins";

async function getPins() {
  const result = await chrome.storage.local.get(CHATPINS_STORAGE_KEY);
  return result[CHATPINS_STORAGE_KEY] ?? [];
}

async function setPins(pins) {
  await chrome.storage.local.set({ [CHATPINS_STORAGE_KEY]: pins });
}
