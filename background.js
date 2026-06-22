const PENDING_OPEN_KEY = "chatpins:pending-open";

chrome.runtime.onInstalled.addListener(() => {
  console.log("ChatPins installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CHATPINS_OPEN_PIN") {
    return false;
  }

  openPin(message.pin)
    .then((tabId) => sendResponse({ success: true, tabId }))
    .catch((error) => {
      console.error("ChatPins could not open this pin", error);
      sendResponse({ success: false });
    });

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    deliverPendingPin(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removePendingPin(tabId);
});

async function openPin(pin) {
  if (!pin?.sourceUrl) {
    throw new Error("Pin has no source URL");
  }

  // Open a blank tab first so the navigation target can be recorded before the
  // ChatGPT page has a chance to finish loading.
  const tab = await chrome.tabs.create({ active: true, url: "about:blank" });
  const pending = await getPendingPins();
  pending[tab.id] = {
    contentHash: pin.contentHash,
    textSnapshot: pin.textSnapshot,
    pinId: pin.id,
  };
  await chrome.storage.local.set({ [PENDING_OPEN_KEY]: pending });
  await chrome.tabs.update(tab.id, { url: pin.sourceUrl });
  return tab.id;
}

async function deliverPendingPin(tabId) {
  const pending = await getPendingPins();
  const target = pending[tabId];
  if (!target) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "CHATPINS_SCROLL_TO_PIN",
      ...target,
    });
  } catch (error) {
    console.error("ChatPins could not contact the ChatGPT page", error);
  } finally {
    await removePendingPin(tabId);
  }
}

async function getPendingPins() {
  const result = await chrome.storage.local.get(PENDING_OPEN_KEY);
  return result[PENDING_OPEN_KEY] ?? {};
}

async function removePendingPin(tabId) {
  const pending = await getPendingPins();
  if (!(tabId in pending)) {
    return;
  }

  delete pending[tabId];
  await chrome.storage.local.set({ [PENDING_OPEN_KEY]: pending });
}
