import { deletePin, getPins } from "../shared/storage.js";

const pinCount = document.querySelector("#pin-count");
const pinList = document.querySelector("#pin-list");
const searchInput = document.querySelector("#pin-search");
const emptyState = document.querySelector("#empty-state");
let pins = [];

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function getPreview(textSnapshot) {
  const text = String(textSnapshot ?? "").trim().replace(/\s+/g, " ");
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

function createPinListItem(pin) {
  const item = document.createElement("li");
  item.className = "pin-item";
  const actions = document.createElement("div");
  actions.className = "pin-actions";

  const openButton = createTextElement("button", "pin-action primary", "Open");
  openButton.type = "button";
  openButton.addEventListener("click", async () => {
    openButton.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "CHATPINS_OPEN_PIN",
        pin,
      });

      if (!response?.success) {
        throw new Error("Background worker could not open the pin");
      }

      window.close();
    } catch (error) {
      openButton.disabled = false;
      console.error("ChatPins could not open this pin", error);
    }
  });

  const snapshot = createTextElement(
    "div",
    "pin-snapshot",
    String(pin.textSnapshot ?? "")
  );
  snapshot.hidden = true;

  const viewButton = createTextElement("button", "pin-action", "View");
  viewButton.type = "button";
  viewButton.setAttribute("aria-expanded", "false");
  viewButton.addEventListener("click", () => {
    const willShow = snapshot.hidden;
    snapshot.hidden = !willShow;
    viewButton.textContent = willShow ? "Hide" : "View";
    viewButton.setAttribute("aria-expanded", String(willShow));
  });

  const copyButton = createTextElement("button", "pin-action", "Copy");
  copyButton.type = "button";
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(String(pin.textSnapshot ?? ""));
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    } catch (error) {
      console.error("ChatPins could not copy this reply", error);
    }
  });

  const deleteButton = createTextElement("button", "pin-action delete", "Delete");
  deleteButton.type = "button";
  deleteButton.addEventListener("click", async () => {
    deleteButton.disabled = true;

    try {
      pins = await deletePin(pin.id);
      renderPins();
    } catch (error) {
      deleteButton.disabled = false;
      console.error("ChatPins could not delete this pin", error);
    }
  });

  const date = createTextElement(
    "time",
    "pin-date",
    formatCreatedAt(pin.createdAt)
  );
  date.dateTime = pin.createdAt || "";
  actions.append(openButton, viewButton, copyButton, deleteButton);
  item.append(
    createTextElement("h2", "pin-title", pin.title || "Untitled pin"),
    createTextElement("p", "pin-source", pin.sourceTitle || "ChatGPT"),
    date,
    createTextElement("p", "pin-preview", getPreview(pin.textSnapshot)),
    snapshot,
    actions
  );
  return item;
}

function getFilteredPins() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  if (!query) {
    return pins;
  }

  return pins.filter((pin) =>
    [pin.title, pin.sourceTitle, pin.textSnapshot].some((value) =>
      String(value ?? "").toLocaleLowerCase().includes(query)
    )
  );
}

function renderPins() {
  const filteredPins = getFilteredPins();
  pinCount.textContent = `${pins.length} ${pins.length === 1 ? "pin" : "pins"}`;
  pinList.replaceChildren(...filteredPins.map(createPinListItem));

  if (pins.length === 0) {
    emptyState.textContent =
      "No pins yet. Pin a reply from ChatGPT to see it here.";
    emptyState.hidden = false;
  } else if (filteredPins.length === 0) {
    emptyState.textContent = "No matching pins.";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

async function loadPins() {
  try {
    pins = await getPins();
    renderPins();
  } catch (error) {
    console.error("Unable to load ChatPins", error);
    pinCount.textContent = "Unable to load pins";
  }
}

searchInput.addEventListener("input", renderPins);
loadPins();
