const CHATPINS_STORAGE_KEY = "chatpins:pins";

export async function getPins() {
  const result = await chrome.storage.local.get(CHATPINS_STORAGE_KEY);
  const pins = result[CHATPINS_STORAGE_KEY];

  return Array.isArray(pins) ? pins : [];
}

export async function savePin(pin) {
  const pins = await getPins();
  const withoutDuplicate = pins.filter((item) => item.id !== pin.id);

  await setPins([pin, ...withoutDuplicate]);
  return pin;
}

export async function deletePin(pinId) {
  const pins = await getPins();
  const updatedPins = pins.filter((pin) => pin.id !== pinId);

  await setPins(updatedPins);
  return updatedPins;
}

export async function updatePin(pinId, updates) {
  const pins = await getPins();
  let updatedPin = null;

  const updatedPins = pins.map((pin) => {
    if (pin.id !== pinId) {
      return pin;
    }

    updatedPin = { ...pin, ...updates, id: pin.id };
    return updatedPin;
  });

  await setPins(updatedPins);
  return updatedPin;
}

export async function clearPins() {
  await setPins([]);
}

async function setPins(pins) {
  await chrome.storage.local.set({ [CHATPINS_STORAGE_KEY]: pins });
}
