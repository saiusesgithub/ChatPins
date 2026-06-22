"use strict";

console.log("ChatPins loaded on ChatGPT");

const PROCESSED_ATTRIBUTE = "data-chatpins-processed";

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

function createPinButton(container) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chatpins-pin-button";
  button.textContent = "📌 Pin";
  button.setAttribute("aria-label", "Pin this assistant reply");

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("ChatPins response:", getResponseText(container));
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
