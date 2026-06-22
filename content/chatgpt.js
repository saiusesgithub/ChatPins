"use strict";

console.log("ChatPins loaded on ChatGPT");

const PROCESSED_ATTRIBUTE = "data-chatpins-processed";
const sharedModules = Promise.all([
  import(chrome.runtime.getURL("shared/storage.js")),
  import(chrome.runtime.getURL("shared/hash.js")),
]);

// ChatGPT's DOM can change. Keep site-specific selectors inside these helpers so
// a future adapter can replace them without changing the injection logic.
function getAssistantMessageContainers(root = document) {
  const assistantMessages = root.querySelectorAll(
    '[data-message-author-role="assistant"]'
  );

  return [
    ...new Set(
      Array.from(assistantMessages, (message) =>
        message.closest("article") || message
      )
    ),
  ];
}

function getAssistantResponse(container) {
  if (container.matches('[data-message-author-role="assistant"]')) {
    return container;
  }

  return container.querySelector('[data-message-author-role="assistant"]');
}

function getResponseActionButton(container) {
  // These selectors may need updating when ChatGPT changes its action controls.
  return container.querySelector(
    '[data-testid="copy-turn-action-button"], button[aria-label="Copy"]'
  );
}

function getResponseText(container) {
  const response = getAssistantResponse(container);
  if (!response) {
    return "";
  }

  const copy = response.cloneNode(true);
  copy.querySelectorAll(".chatpins-pin-button").forEach((button) => button.remove());
  return copy.innerText.trim();
}

function getSourceUrl() {
  const sourceUrl = new URL(window.location.href);
  sourceUrl.hash = "";
  return sourceUrl.toString();
}

function getMessageIndex(container) {
  return getAssistantMessageContainers().indexOf(container);
}

async function findPinnedMessage(contentHash, textSnapshot) {
  const [, { normalizeText, hashText }] = await sharedModules;
  const containers = getAssistantMessageContainers();

  for (const container of containers) {
    const responseHash = await hashText(getResponseText(container));
    if (responseHash === contentHash) {
      return container;
    }
  }

  const snapshotStart = normalizeText(textSnapshot).slice(0, 120);
  if (!snapshotStart) {
    return null;
  }

  return (
    containers.find((container) =>
      normalizeText(getResponseText(container)).includes(snapshotStart)
    ) ?? null
  );
}

async function scrollToPin(message) {
  const container = await findPinnedMessage(
    message.contentHash,
    message.textSnapshot
  );

  if (!container) {
    console.log(
      "ChatPins could not find this reply. The saved snapshot still exists in the popup."
    );
    return false;
  }

  container.scrollIntoView({ behavior: "smooth", block: "center" });
  container.classList.add("chatpins-pin-highlight");
  setTimeout(() => container.classList.remove("chatpins-pin-highlight"), 2000);
  return true;
}

async function saveAssistantReply(container, button) {
  const [{ savePin }, { normalizeText, hashText, createId }] =
    await sharedModules;
  const textSnapshot = getResponseText(container);
  const normalizedText = normalizeText(textSnapshot);

  const pin = {
    id: createId(),
    type: "chatgpt-reply",
    title: normalizedText.slice(0, 80),
    sourceUrl: getSourceUrl(),
    sourceTitle: document.title,
    messageIndex: getMessageIndex(container),
    contentHash: await hashText(normalizedText),
    textSnapshot,
    createdAt: new Date().toISOString(),
  };

  await savePin(pin);
  button.textContent = "📌 Pinned";
  button.disabled = true;
}

function createPinButton(container) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chatpins-pin-button";
  button.textContent = "📌 Pin";
  button.setAttribute("aria-label", "Pin this assistant reply");

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    button.disabled = true;

    try {
      await saveAssistantReply(container, button);
    } catch (error) {
      button.disabled = false;
      console.error("ChatPins could not save this reply", error);
    }
  });

  return button;
}

function injectPinButton(container) {
  if (
    container.hasAttribute(PROCESSED_ATTRIBUTE) ||
    container.querySelector(".chatpins-pin-button")
  ) {
    return;
  }

  const response = getAssistantResponse(container);
  if (!response) {
    return;
  }

  const pinButton = createPinButton(container);
  const actionButton = getResponseActionButton(container);

  if (actionButton?.parentElement) {
    actionButton.insertAdjacentElement("afterend", pinButton);
  } else {
    const fallbackActions = document.createElement("div");
    fallbackActions.className = "chatpins-pin-fallback";
    fallbackActions.append(pinButton);
    container.append(fallbackActions);
  }

  container.setAttribute(PROCESSED_ATTRIBUTE, "true");
}

function processAssistantMessages() {
  getAssistantMessageContainers().forEach(injectPinButton);
}

let scanScheduled = false;

function scheduleMessageScan() {
  if (scanScheduled) {
    return;
  }

  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    processAssistantMessages();
  });
}

const observer = new MutationObserver(scheduleMessageScan);
observer.observe(document.body, { childList: true, subtree: true });

processAssistantMessages();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CHATPINS_SCROLL_TO_PIN") {
    return false;
  }

  scrollToPin(message)
    .then((success) => sendResponse({ success }))
    .catch((error) => {
      console.error("ChatPins could not locate this reply", error);
      sendResponse({ success: false });
    });

  return true;
});
