# Privacy Policy – CSM Bits

_Last updated: October 2026_

**The extension has no server and no analytics. We (the developer) never receive your data.**

## Data the extension handles

| Data | Why | Where it is stored |
| --- | --- | --- |
| Settings, quick links, notes, to-dos, widget layout | Customization | `chrome.storage.local` in your browser |
| Wallpaper image / GIF / video | Background | Your browser (IndexedDB / local storage) |
| Time spent per site (domain only) | Site Time Tracker and Time Budget | Your browser, last 120 days |
| Copied text and page snapshots (small image, text, link) | Clipboard History and Snapshots | Your browser. Text copied from password fields is not saved |
| Tab Lock passcode | Locking tabs | Only a salted PBKDF2 hash, in your browser, never synced |
| History and bookmarks | Shown on the New Tab page and command palette | Read from Chrome on demand, not copied elsewhere |

## Optional Firebase Sync

If you enter your own Firebase API key, the extension sends your settings, links, notes, clipboard history, snapshots and time-tracker data to **your own** Firestore database. If you set a passphrase, data is encrypted with AES-256 before it leaves your browser. You control that project and can delete the data at any time.

## What we do not do

We do not sell or share data, use it for advertising or credit decisions, or load remote code.

## Permissions

Access to all sites lets the glass theme, Bangla typing, clipboard capture and Tab Lock run on web pages. `tabs`, `history` and `bookmarks` power the New Tab page, command palette and tab manager. `clipboardWrite` powers copy buttons. `idle` and `alarms` support time tracking and Tab Lock. `webNavigation` lets Tab Lock protect browser pages you choose.

## Contact

Open an issue on this repository.
