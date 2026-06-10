# YouTube Playlist Helper

A Chrome extension that adds quick buttons to YouTube video thumbnails for
managing playlists. It works by simulating clicks on YouTube's own menus
(Click-Simulation), so it needs no API keys and no Google sign-in beyond your
normal YouTube session.

## Features

- **Two Quick-Add Buttons** on every eligible thumbnail:
  - **`+`** → saves the video to your **Watch Later** playlist.
  - **`★`** → saves the video to your **configured Target Playlist** (the
    playlist name you set in the toolbar popup).
- **Toolbar popup** to set the Target Playlist name. The name is stored in
  `chrome.storage.sync`, so it persists across browser restarts and syncs to
  other machines signed into the same Google account.
- **Quick-Remove (`x`)** button on **any** playlist page (`/playlist?list=…`),
  including Watch Later. It removes the video from the playlist currently being
  viewed.
- **Multi-language support** (10 languages) for matching YouTube's native menu
  items.
- **Visual feedback** on every action: in-progress (`⋯`), success (`✓`), and
  error (`x`).

## Installation

1. Download this project's files (the whole folder).
2. Go to `chrome://extensions/` → enable **Developer mode**.
3. Click **Load unpacked** → select the folder containing these files.
4. Visit YouTube → look for the `+` and `★` buttons on video thumbnails.

## Usage

### Set your Target Playlist

1. Click the extension's toolbar icon to open the popup.
2. Type the **exact name** of the playlist you want the `★` button to target
   (e.g. `Musique`) and click **Save** (or press Enter).
3. Re-opening the popup shows the name you saved.

The name is read at **click time**, so changing it in the popup retargets the
next `★` click without reloading the page. (The button's hover tooltip may keep
showing the previous name until the next page load — this is expected.)

If no Target Playlist name is configured, the `★` button still appears but is
greyed-out and non-clickable, so the feature stays discoverable.

### Quick-Add

On any eligible thumbnail:

- Click **`+`** to save to **Watch Later**.
- Click **`★`** to save to your **configured Target Playlist**. Hover over `★`
  to see which playlist it will save to.

Eligible thumbnails exclude Mix tiles, playlist tiles, Shorts, search
suggestions, the video player area, and playlist headers.

### Quick-Remove

On any playlist page (`/playlist?list=…`, including Watch Later), each item
shows an **`x`** button that removes that video from the playlist you are
currently viewing.

## Supported Languages

French, English, Spanish, German, Italian, Japanese, Korean, Portuguese,
Russian, Arabic.

## Development

Pure, playlist-independent logic is extracted into `helpers.js` and the Menu
Phrase checker into `menu-phrases.js`, both covered by Node's built-in test
runner (zero dependencies) via `helpers.test.js` and `menu-phrases.test.js`:

```sh
npm test
```

The Click-Simulation paths (Quick-Add to Watch Later, Quick-Add to the Target
Playlist, and Quick-Remove) drive YouTube's live UI and are **not** covered by
automated tests. Use the manual checklist below — and re-run it whenever
YouTube changes its UI.

### Manual verification checklist

Run these against a real YouTube session after any change to the
Click-Simulation paths or after a YouTube UI update:

- [ ] **Watch Later save:** clicking `+` on an eligible thumbnail saves the
      video to Watch Later; the button shows `⋯` then `✓`.
- [ ] **Target Playlist save:** with a Target Playlist configured, clicking `★`
      saves the video to that exact playlist.
- [ ] **Tooltip:** hovering `★` shows the configured Target Playlist name.
- [ ] **Disabled empty state:** with no name configured, `★` renders
      greyed-out and does nothing when clicked.
- [ ] **Popup change without reload:** change the name in the popup, then click
      `★` on the same (unreloaded) page — it saves to the new playlist.
- [ ] **Quick-Remove on a non-WL playlist page:** on a `/playlist?list=…` page
      that isn't Watch Later, `x` removes the item and it disappears.
- [ ] **Quick-Remove on Watch Later:** `x` still removes items on the Watch
      Later page.
- [ ] **Lazy-loaded thumbnails:** buttons appear on thumbnails loaded by
      scrolling, not just the initial set.
- [ ] **In-app navigation:** buttons still appear after navigating within
      YouTube (e.g. home → a playlist) without a full page reload.
- [ ] **Non-English UI:** repeat at least one save and one remove with YouTube
      set to a non-English language.

## Files

- `manifest.json` — extension configuration (MV3): `storage` permission, toolbar
  popup, and content-script load order.
- `popup.html` / `popup.js` — toolbar popup for setting the Target Playlist name.
- `helpers.js` — pure, unit-tested helpers (`extractVideoId`,
  `isEligibleThumbnail`, `resolveButton2`, `getPlaylistContext`).
- `helpers.test.js` — `node:test` unit tests for the helpers.
- `menu-phrases.js` — Menu Phrase dictionary: the `Action` enum plus a pure
  `matches(action, text)` checker for matching YouTube's localized menu items
  and menu-button aria-labels.
- `menu-phrases.test.js` — `node:test` unit tests for the `matches` checker.
- `action-buttons.js` — the two button factories (`makeAddButton`,
  `makeRemoveButton`) plus the shared `⋯`/`✓`/`x` feedback handle
  (`pending`/`success`/`error`).
- `click-simulation.js` — the three Click-Simulation verbs (`addToWatchLater`,
  `addToPlaylist`, `removeFromCurrent`) and the private `waitFor` polling
  primitive; owns the single menu-open → poll → match → click spine.
- `thumbnail-buttons.js` — renders the `+`, `★`, and `x` buttons via the
  `action-buttons.js` factories and wires their click handlers to the
  `click-simulation.js` verbs (no inline styling or menu-sim logic).
- `playlist-management.js` — Quick-Remove call site: builds the `x` button via
  the factory and drives the `removeFromCurrent` verb, animating the item out.
- `page-monitor.js` — watches for new/lazy-loaded thumbnails and in-app
  navigation.
- `content.js` — entry point; reads the stored Target Playlist name and keeps it
  current.
- `package.json` — minimal, zero-dependency `test` script.

---

*Not affiliated with YouTube/Google*
