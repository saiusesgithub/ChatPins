export function normalizeText(text) {
  return String(text ?? "").trim().replace(/\s+/g, " ");
}

export async function hashText(text) {
  const normalizedText = normalizeText(text);
  const bytes = new TextEncoder().encode(normalizedText);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function createId() {
  const timestamp = Date.now();

  if (typeof crypto.randomUUID === "function") {
    return `${timestamp}-${crypto.randomUUID()}`;
  }

  return `${timestamp}-${Math.random().toString(36).slice(2)}`;
}
