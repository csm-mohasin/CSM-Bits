# 🪟 CSM Bits

A glass-style (glassmorphism) **New Tab** and **website theme** for Chrome, packed with productivity tools: draggable widgets, video/GIF wallpapers, passcode Tab Lock, a site time tracker, clipboard history, page snapshots, a command palette and Bangla phonetic typing. Every feature can be switched on or off in **🎛 CSM Bits Studio** (the settings page).

> Developed by [Mohasin Alam](https://mohasin.bro.bd) · MIT licensed · No server, no analytics

---

## Table of contents

1. [New Tab page](#1-new-tab-page)
2. [Wallpaper & glass look](#2-wallpaper--glass-look)
3. [Visual effects](#3-visual-effects)
4. [Website glass theme](#4-website-glass-theme)
5. [Tab Lock](#5-tab-lock)
6. [Command Palette](#6-command-palette)
7. [Text selection popup](#7-text-selection-popup)
8. [Bangla phonetic typing](#8-bangla-phonetic-typing)
9. [Time tracking](#9-time-tracking)
10. [Clipboard History](#10-clipboard-history)
11. [Page Snapshots](#11-page-snapshots)
12. [Screenshots](#12-screenshots)
13. [Side Panel (Tab Manager)](#13-side-panel-tab-manager)
14. [Tools & notes](#14-tools--notes)
15. [Sync, backup & privacy](#15-sync-backup--privacy)
16. [Install](#install)
17. [Keyboard shortcuts](#keyboard-shortcuts)
18. [Development & license](#development)

---

## 1. New Tab page

- **Profile card** – photo, name, badge line, status pill, typewriter-style rotating roles, bio, skill chips, location, and buttons for Portfolio, GitHub, Email and CV.
- **Profile editor** – click the ✏ button on the card to edit everything in a pop-up; upload a local photo or use an image link; reset to defaults.
- **Verified badge** – optional ✓ badge next to your name.
- **Neon / Accent theme** – card colors can follow a neon cyan-purple theme or your wallpaper's accent color.
- **Card effects** – rotating glowing border, mouse spotlight, tilt and an aurora background (each can be turned off).
- **Live stats strip** – time spent today, tasks left, number of clipboard items and number of snapshots, each linking to its page.
- **Clock and date** – large live clock with a full date.
- **Time-based greeting** – "Good morning / afternoon / evening / night" with your name (can be turned off).
- **Smart search bar** – choose Google, Bing, DuckDuckGo, YouTube or GitHub as the default engine.
- **Search bangs** – type `yt`, `gh`, `g`, `b`, `ddg`, `w` (Wikipedia), `maps` or `tr` (Translate) before your query; URLs and domains typed in the bar open directly.
- **Quick Links** – your own shortcut tiles with favicons or emoji icons, adjustable size, gap and shape (rounded, circle, square) and optional labels.
- **Link folders** – group links into folders, open a folder, rename it, take items out, or break the folder up.
- **Link context menu** – right-click a link to edit it, open it in a new tab, or move it out of a folder.
- **To-do list** – add tasks, tick them off and delete them; the remaining count shows in the stats strip.
- **Pomodoro timer** – focus and break modes with adjustable lengths, start/pause, reset and skip.
- **Bookmarks widget** – your most recent bookmarks.
- **History widget** – your recent browsing history.
- **Choose how many** history and bookmark items to show (or hide either widget).
- **Drag-and-drop layout** – click ✥ to enter edit mode, drag any widget (Profile, Clock, Search, Links, To-do, Pomodoro, Bookmarks, History) anywhere.
- **Hide / restore widgets** – ✕ hides a widget and a ＋ chip brings it back.
- **Grid snapping** – widgets snap to a 10px grid; hold `Alt` for free movement; **Reset** restores the default layout.
- **Quick toolbar** – shortcuts to Firebase Sync, Clipboard & Snapshots, Stats, JSON Tools, CSM Bits Studio, layout editing, lock-all and the wallpaper panel.
- **Developer credit** – a small footer linking to [mohasin.bro.bd](https://mohasin.bro.bd).

## 2. Wallpaper & glass look

- **Preset gradients** – seven built-in backgrounds.
- **Your own image** – upload from your computer (large images are resized automatically).
- **Image link** – use any image URL.
- **GIF wallpaper** – animated GIFs play as your background.
- **Video wallpaper** – MP4 or WebM videos play muted and looped; the video is stored locally in your browser.
- **Wallpaper on websites** – optionally show the GIF/video wallpaper behind websites too (uses more CPU).
- **Wallpaper blur** – adjustable.
- **Glass opacity and glass blur** – adjust how frosted the cards look.
- **Wallpaper gallery** – keep up to 12 images and switch between them with a click.
- **Slideshow** – rotate wallpapers on every new tab or every N minutes.
- **Accent color sync** – the dominant color of your wallpaper is detected automatically and used across the UI; you can also pick a custom color or re-extract it any time.

## 3. Visual effects

- **Parallax wallpaper** – the background moves gently with your mouse; adjustable strength and smoothness.
- **Auto drift** – the parallax drifts slowly by itself, with adjustable speed.
- **Glow cursor** – a soft light that follows the pointer.
- **Cursor styles** – Glow, Glass Ball, Ring + Dot, or Dot only.
- **Cursor tuning** – size, blur, brightness, follow speed and color (accent or custom).
- **Hover growth** – the cursor grows over links and buttons.
- **Click ripple** – a ring ripple on every click.
- **Hide native cursor** – optionally replace the real mouse cursor.
- **Both effects can run on websites too**, or only on the New Tab page.

## 4. Website glass theme

- **Glass theme on every site** – a translucent, blurred look applied to web pages with your wallpaper behind them.
- **Per-site toggle** – turn the theme on or off for the current site from the palette or Side Panel.
- **Skip list** – a list of domains where the theme is never applied.

## 5. Tab Lock

- **Passcode lock screen** – a glass overlay covers the page until you enter your passcode.
- **Secure passcode storage** – only a salted PBKDF2 hash is stored; it is never synced.
- **Lock on tab switch** – with an adjustable delay (0 = instantly).
- **Lock on window focus loss** – when you switch to another app.
- **Lock on idle** – after a chosen idle time or when the screen locks.
- **Lock on browser restart** – tabs start locked after Chrome is closed and reopened.
- **Auto-relock timeout** – tabs lock again a set number of minutes after unlocking.
- **Site scope** – lock all sites, or only a list of sites, plus a "never lock" list.
- **Lock the New Tab page** – optional.
- **Protected browser pages** – pages such as `chrome://extensions` are guarded by a passcode gate even when typed directly (list is editable).
- **Lock-out protection** – repeated wrong passcodes trigger growing wait times.
- **Locked settings** – with a passcode set, Tab Lock settings only change after you unlock them (10 minutes).
- **Lock now** – `Alt+Shift+L`, the 🔒 button on the New Tab page, or the command palette.
- **Change or remove passcode** from CSM Bits Studio.

> Tab Lock deters casual snooping. It is not a replacement for an operating-system login, and it cannot stop someone from disabling the extension.

## 6. Command Palette

Press `Ctrl+K` (key is configurable) on any normal web page to open it. It can:

- run **commands** – open CSM Bits Studio, Stats, JSON Formatter, Clipboard, Snapshots, Time Budget settings and Firebase Sync settings;
- **take a snapshot** or a **full-page / single-screen screenshot**;
- **toggle** Bangla typing, the website glass theme, cursor effect, parallax and the selection popup;
- **lock all tabs** instantly;
- **group tabs by domain**, **close duplicate tabs** and open the Side Panel;
- **export / import** settings;
- search your **open tabs**, **bookmarks** and **history**;
- act as a **calculator** (type `2*8+3` and press Enter to copy the result);
- search Google with whatever you typed;
- open a **quick note** for the current site.

It does not run on `chrome://` pages, the Web Store or the PDF viewer (Chrome blocks extensions there).

## 7. Text selection popup

Select text on any page to get a small glass toolbar with:

- **Copy**
- **Search** (using your chosen engine)
- **Translate** (to your chosen language, default Bengali)
- **Note** (saves the text to that site's notes)

Each button can be turned off individually.

## 8. Bangla phonetic typing

- Press `Alt+B` in any text field to switch between English and Bangla (the key is configurable).
- Type Bangla pronunciation in English letters: `ami` → আমি, `bangla` → বাংলা, `bhalo` → ভালো.
- **Avro-style rules** – `O` for ও/ো, `T Th D Dh N` for ট ঠ ড ঢ ণ, `S Sh`, `R`, `ng`, `Ng`, `^`, `:`, `t\``, `rri`, `kkh`, `gg`, `,,` for hasanta, plus automatic ra-/ya-/ba-phala.
- **Bangla digits** – optional (১২৩).
- **Dari key** – pressing `.` can type the Bangla full stop `।`.
- **Indicator pill** – a small "বাং / EN" badge in text fields that you can also click to toggle.
- **Smart backspace** – steps back one character at a time.
- **Safe by design** – does not work in password, email or number fields.
- **Test box** in CSM Bits Studio to practice.

## 9. Time tracking

- **Site Time Tracker** – automatically records the active time you spend on each domain (idle time is excluded; the idle threshold is adjustable).
- **Stats page** – daily, weekly and monthly views with totals, number of sites, daily average, comparison with yesterday or the previous period, busiest day and active days.
- **Charts and top sites** – a bar chart plus a ranked list of your most-used sites.
- **CSV export** of your data, and a button to delete all tracker data.
- **Local only** – the last 120 days are kept in your browser.
- **Time Budget** – when a site loads, a glass pop-up asks how long you plan to use it (2, 5, 10, 15, 20, 30 minutes, unlimited, or a custom time).
- **Budget countdown chip** – an optional timer in the page corner.
- **When time is up** – you get a pop-up (or a notification if you are on another tab) to extend by a few minutes or close the tab.
- **Budget scope** – ask on all sites or only on listed sites, with a "never ask" list and a reset button.

## 10. Clipboard History

- **Auto-saves copied text** from web pages (never from password fields).
- **Search** through your clips.
- **Pin** important clips so they are never cleared.
- **Open the source page**, copy the text again, copy the link, or delete a clip.
- **Clear all except pinned** in one click.
- **Adjustable limits** – how many clips to keep and the maximum length.

## 11. Page Snapshots

- **One-key snapshot** – `Alt+Shift+S` saves a small preview image, the page text, its link and your scroll position.
- **Also available** from the Side Panel, the palette and the hub page.
- **Search** snapshots by title, link or text.
- **Reopen** the page, copy the text or link, or delete a snapshot.
- **Adjustable count** – keep 5 to 100 snapshots.

## 12. Screenshots

- **Full-page screenshot** with a glass frame (stitched while scrolling).
- **Visible-area screenshot** of the current screen only.
- **Customize the result** – solid color or transparent background, padding, a fake browser bar and a glass border.
- **Download as PNG** or **copy to clipboard**, and retake in one click.

## 13. Side Panel (Tab Manager)

- **Tab list across windows** with search.
- **Group tabs by domain**, **ungroup** them, and **close duplicate tabs** with a count of how many were closed.
- **Sessions** – save the current set of tabs and reopen it later in a new window.
- **Site notes** – a note that auto-saves for the site you are on.
- **Toggle the glass theme** for the current site.
- **Quick tools** – full-page screenshot, visible screenshot, snapshot, and links to Stats and Clipboard.
- **Bookmarks and History** browsers.
- **Firebase Sync setup** right inside the panel.

## 14. Tools & notes

- **JSON Formatter** – format, minify and sort keys (A→Z), with 2-space, 4-space or tab indentation; error messages include line and column; paste, copy and clear buttons.
- **Quick notes per site** – open from the palette or the selection popup; auto-saved and included in backups.
- **CSM Bits Hub** – one page that holds your Clipboard History and Snapshots.

## 15. Sync, backup & privacy

- **Firebase Sync** – optional automatic backup of settings, quick links, notes, clipboard history, snapshots, widget layout and time-tracker data to **your own** Firebase project.
- **Easy setup** – paste your `firebaseConfig` and the extension picks out the API key and project ID; a **Test connection** button and **Sync now** button are included.
- **AES-256 encryption** – set a passphrase and data is encrypted before it leaves your browser.
- **Multi-device** – install the extension on another device and enter the same key (and passphrase) to restore everything.
- **Export / Import** – save everything to a JSON file and restore it, choosing which optional parts to include; or reset all settings.
- **Privacy first** – no analytics and no server of ours; see [PRIVACY.md](PRIVACY.md).

---

## Install

Works in Chrome, Edge and Brave.

1. Download the latest zip from the [Releases](../../releases) page and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped folder (the one containing `manifest.json`).
4. Open a new tab.

To update, download the new release and press the reload icon on `chrome://extensions`.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` | Command palette |
| `Alt+B` | Toggle Bangla typing |
| `Alt+Shift+S` | Snapshot current page |
| `Alt+Shift+L` | Lock all tabs |

The palette and Bangla keys can be changed in CSM Bits Studio; browser-level shortcuts at `chrome://extensions/shortcuts`.

## Development

No build step. Edit the files in `extension/`, then press reload on `chrome://extensions`. The optional `theme/` folder is a separate Chrome theme (also loaded with Load unpacked).

## License

[MIT](LICENSE) © CSM Mohasin Alam
