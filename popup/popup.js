import { getPins } from "../shared/storage.js";

const pinCount = document.querySelector("#pin-count");
const pinList = document.querySelector("#pin-list");

async function renderPins() {
  try {
    const pins = await getPins();

    pinCount.textContent = `${pins.length} ${pins.length === 1 ? "pin" : "pins"}`;
    pinList.replaceChildren();

    for (const pin of pins) {
      const item = document.createElement("li");
      item.textContent = pin.title || "Untitled pin";
      pinList.append(item);
    }
  } catch (error) {
    console.error("Unable to load ChatPins", error);
    pinCount.textContent = "Unable to load pins";
  }
}

renderPins();
