import { getPins } from "../shared/storage.js";

const pinCount = document.querySelector("#pin-count");
const pinList = document.querySelector("#pin-list");

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
  item.append(
    createTextElement("h2", "pin-title", pin.title || "Untitled pin"),
    createTextElement(
      "p",
      "pin-source",
      pin.sourceTitle || "ChatGPT"
    ),
    createTextElement("time", "pin-date", formatCreatedAt(pin.createdAt)),
    createTextElement("p", "pin-preview", getPreview(pin.textSnapshot))
  );
  return item;
}

async function renderPins() {
  try {
    const pins = await getPins();

    pinCount.textContent = `${pins.length} ${pins.length === 1 ? "pin" : "pins"}`;
    pinList.replaceChildren();

    for (const pin of pins) {
      pinList.append(createPinListItem(pin));
    }
  } catch (error) {
    console.error("Unable to load ChatPins", error);
    pinCount.textContent = "Unable to load pins";
  }
}

renderPins();
