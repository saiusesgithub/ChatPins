# ChatPins

> Pin important AI replies. Jump back later.

ChatPins is a Chrome extension for saving important assistant replies inside long AI conversations. Pin a useful ChatGPT response, find it later in the popup, and open the original conversation at that reply.

## Why it exists

Long AI chats become difficult to navigate. Browser bookmarks can reopen a conversation, but they cannot identify the specific reply that mattered. ChatPins adds message-level bookmarks and keeps a local snapshot as a reliable fallback.

## MVP features

- Adds a small pin button to ChatGPT assistant replies.
- Saves the reply text, source conversation, timestamp, and content hash locally.
- Searches saved pins by title, source, or reply text.
- Opens the original conversation and attempts to scroll to the pinned reply.
- Displays the saved snapshot when the original reply cannot be found.
- Copies snapshots to the clipboard.
- Deletes saved pins.

## Install locally in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the ChatPins project folder.

No dependencies, build tools, or installation commands are required.

## Test locally in Firefox

Prepare the Firefox-compatible manifest before loading the extension:

```powershell
Copy-Item manifest.firefox.json manifest.json
```

On macOS or Linux, run `cp manifest.firefox.json manifest.json` instead.

Then:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on**.
3. Select `manifest.json` in the ChatPins project folder.

Firefox temporary add-ons are removed when Firefox closes. To switch the project back to its default Chrome manifest, copy `manifest.chrome.json` to `manifest.json`.

## Privacy

ChatPins is local-only:

- All pins and snapshots stay in `chrome.storage.local` on your device.
- There is no backend or account system.
- There are no analytics.
- The extension makes no external network requests.

## Current limitations

- ChatGPT is the only supported AI chat service in the MVP.
- Jumping to a reply can fail when ChatGPT has not rendered that message, such as in long or lazily loaded conversations.
- The locally saved snapshot remains available through **View** even when scrolling fails.

## Roadmap

- Firefox support
- Claude support
- Tags
- Export as Markdown
