# Configurable Target Playlist, two-button Quick-Add, and any-page Quick-Remove

Vertical-slice issues for this iteration. Each slice is a tracer bullet — a thin
end-to-end path that is demoable on its own. Stays on Click-Simulation; no API and
no adapter seam this iteration (per ADR 0001). Source issue files live in
`docs/issues/`.

| # | Slice | Type | Blocked by |
|---|-------|------|------------|
| 0001 | Popup + storage plumbing (walking skeleton) | AFK | — |
| 0002 | Wire Button 2 to the configured name + disabled empty state | AFK | 0001 |
| 0003 | Quick-Remove on any playlist page | AFK | — |
| 0004 | README correction + manual verification checklist | AFK | 0002, 0003 |

0001 and 0003 can start in parallel.

---

## 0001 — Popup + storage plumbing (walking skeleton)

**Type:** AFK · **Blocked by:** None — can start immediately

### What to build

The thinnest end-to-end path through the configuration pipeline, plus the
project's first test harness. A user can open a popup from the extension's
toolbar icon, type a Target Playlist name, save it, and have it persist; the
content script can read that name back. No Quick-Add Button behavior changes in
this slice — Button 2 still targets the hardcoded value. This slice exists to
stand up the manifest plumbing, the storage contract, and the test runner so the
following slices have something to build on.

Scope:
- Add an `action` with a `default_popup` and the `storage` permission to the
  extension manifest.
- A popup containing a single text field for the Target Playlist name and a save
  action; the value is written to `chrome.storage.sync` as a single plain string.
- The content script reads the stored name on load (no behavioral use yet beyond
  confirming the round-trip).
- Stand up the test harness: a minimal `package.json` with a `test` script using
  Node's built-in `node:test` (zero added dependencies).
- Extract and unit-test the two playlist-independent pure helpers:
  - `extractVideoId(href)` → video id from a watch URL, or null.
  - `isEligibleThumbnail(descriptor)` → boolean "skip Mix/playlist/Shorts/
    search-suggestion/player/playlist-header" predicate, fed a plain descriptor
    (not live DOM nodes).

### Acceptance criteria

- [ ] Clicking the extension's toolbar icon opens a popup with a single playlist-name text field and a save action.
- [ ] Saving a name writes a single string to `chrome.storage.sync`; the value persists across browser restarts and is visible on a second machine signed into the same Google account.
- [ ] Re-opening the popup shows the previously saved name.
- [ ] The content script reads the stored name on load without errors when the value is set, empty, or unset.
- [ ] `npm test` runs via `node:test` with no added dependencies.
- [ ] `extractVideoId` is covered: valid watch URLs, extra params, non-watch URLs, missing `v`, malformed input → correct id or null.
- [ ] `isEligibleThumbnail` is covered: eligible single-video returns true; Mix, playlist tile, Shorts, search-suggestion, player-area, playlist-header each return false.
- [ ] No change to existing Quick-Add or Quick-Remove behavior on a real YouTube page.

---

## 0002 — Wire Button 2 to the configured name + disabled empty state

**Type:** AFK · **Blocked by:** 0001

### What to build

Make the second Quick-Add Button (`★`) target the user's configured Target
Playlist instead of the hardcoded `"Musique"`. On each eligible thumbnail the
button reads the stored playlist name at click time, performs the Click-Simulation
save to that playlist, and shows the configured name as a hover tooltip. When no
name is configured, the button still renders but is greyed-out and non-clickable,
so the feature is discoverable. The Watch Later `+` button is unchanged and
remains a permanent Click-Simulation action (ADR 0001).

Because the name is read at click time, changing it in the popup affects the next
save without a page reload; the tooltip may lag until the next page load
(accepted, to avoid live re-render).

Scope:
- Replace the hardcoded `"Musique"` match with the stored name in Button 2's
  Click-Simulation save path.
- Surface the configured name as Button 2's `title`/tooltip.
- Disabled empty state driven by a pure helper `resolveButton2(config)` →
  `{ render: true, enabled, playlistName }`, unit-tested.

### Acceptance criteria

- [ ] With a Target Playlist name configured, clicking `★` on an eligible thumbnail saves the video to that exact playlist via Click-Simulation, across the existing supported languages.
- [ ] Button 2's tooltip shows the configured playlist name on hover.
- [ ] With no name configured, Button 2 renders greyed-out and is non-clickable.
- [ ] Changing the name in the popup changes where the next `★` click saves, without reloading the page.
- [ ] The Watch Later `+` button behavior is unchanged.
- [ ] `resolveButton2` is covered: empty/whitespace name → render + disabled; valid name → render + enabled with the name passed through.
- [ ] In-progress / success / error visual feedback on `★` still works.

---

## 0003 — Quick-Remove on any playlist page

**Type:** AFK · **Blocked by:** None — independent of the popup work

### What to build

Extend the Quick-Remove Button from the Watch Later page to **any** playlist page.
While viewing a `/playlist?list=…` page, each item shows a Quick-Remove (`x`)
button that removes that video from the playlist currently being viewed, via
Click-Simulation of YouTube's native "Remove from …" menu item. The Watch Later
page continues to work as before (it is just one playlist page among many).

This is largely the removal of the current Watch-Later-only gate. On a playlist
page exactly one playlist is in view, so the native "Remove from …" item is
unambiguous, and the existing generic "Remove from" multi-language text matching
is reused.

Scope:
- Drop the `list=WL`-only gate so the Quick-Remove Button appears on any playlist
  page.
- Determine playlist context via a pure helper `getPlaylistContext(url)` →
  `{ isPlaylistPage, listId }`, unit-tested.
- Keep the existing remove feedback and the item-disappears animation.

### Acceptance criteria

- [ ] On any `/playlist?list=…` page, eligible items show a Quick-Remove `x` button.
- [ ] Clicking it removes the video from the playlist currently being viewed and the item visibly disappears.
- [ ] Quick-Remove still works on the Watch Later page.
- [ ] Removal works across the existing supported languages via the generic "Remove from" matching.
- [ ] In-progress / success / error feedback on the Quick-Remove Button still works.
- [ ] `getPlaylistContext` is covered: `list=WL`, arbitrary `list=…`, non-playlist pages, and watch pages carrying a `list` param → correct `{ isPlaylistPage, listId }`.

---

## 0004 — README correction + manual verification checklist

**Type:** AFK · **Blocked by:** 0002, 0003

### What to build

Bring the README in line with the shipped behavior. The current README describes
only the old single Watch Later `+` button and is otherwise stale. Rewrite it to
describe the two Quick-Add Buttons (`+` → Watch Later, `★` → configured Target
Playlist), the toolbar popup used to set the Target Playlist name, and the
any-playlist-page Quick-Remove Button. Add a manual verification checklist for the
Click-Simulation paths, since those are not covered by automated tests and must be
re-checked against live YouTube after YouTube UI changes.

Scope:
- Rewrite README features/usage/installation to match the two-button + popup +
  any-page Quick-Remove behavior.
- Add a manual verification checklist covering: Watch Later save; configured
  Target Playlist save; tooltip; disabled empty state; popup name change applying
  without reload; Quick-Remove on a non-WL playlist page and on the Watch Later
  page; buttons on lazy-loaded thumbnails; buttons surviving in-app navigation;
  at least one non-English UI.

### Acceptance criteria

- [ ] README accurately describes both Quick-Add Buttons and which playlist each targets.
- [ ] README documents the toolbar popup and how to set the Target Playlist name.
- [ ] README documents Quick-Remove working on any playlist page.
- [ ] README no longer contains stale claims about a single Watch Later-only `+` button.
- [ ] A manual verification checklist is present and covers the Click-Simulation paths listed above.
