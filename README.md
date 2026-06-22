# ChatPins

ChatPins is a Chrome Manifest V3 extension for pinning important AI replies and jumping back to them later.

ChatPins saves a local snapshot and hash of every pinned reply in Chrome extension storage. This data stays on the user's device.

- **Open** loads the original ChatGPT conversation and tries to jump to the pinned reply.
- **View** displays the saved local snapshot, even when the original message cannot be found or loaded.

## Development

This project uses plain JavaScript, HTML, and CSS. It has no dependencies or build step.

To load it locally:

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory.

The initial version targets `https://chatgpt.com/*`.
