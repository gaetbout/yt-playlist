# Deepen the Click-Simulation core: dictionary, button factories, one module

Vertical-slice issues for this refactor iteration. The goal is a **behaviour-
preserving** deepening of the three triplicated Click-Simulation flows (`+` →
Watch Later, `★` → Target Playlist, `x` → Quick-Remove) that today inline the
same sequence across `thumbnail-buttons.js` and `playlist-management.js`.

Each slice is a tracer bullet — end-to-end and demoable on its own — and every
slice keeps the live behaviour identical. The only automated test coverage added
is in slice 0001 (the dictionary is the pure test surface); the Click-Simulation
paths stay on the manual checklist, re-run in slice 0004.

Architecture decisions already settled (do not re-litigate during implementation):

- **A — Click-Simulation module** speaks **click-sim-native verbs** (one real
  adapter today; reshape when the API adapter of ADR 0001 actually lands). Verbs
  return `Promise<void>` and **never touch the button**; the caller drives
  feedback. Target's modal step stays inline in its verb.
- **B — Menu Phrase dictionary** exposes an `Action` **enum** plus a **pure
  `matches(action, text)` checker**; matching is normalised to lowercase on both
  sides. Terms **Menu Action** and **Menu Phrase** are defined in `CONTEXT.md`.
- **C — Action-button factories**: two named factories; `success()` is a terminal
  `✓`+lock (add only); `error()` self-reverts after 1500ms; the module does not
  own insertion; Quick-Remove vanishes caller-side.

| # | Slice | Type | Blocked by |
|---|-------|------|------------|
| 0001 | Menu Phrase dictionary (`Action` enum + `matches`) | AFK | — |
| 0002 | Action-button factories + feedback handle | AFK | — |
| 0003 | Click-Simulation module + call-site rewrite | AFK | 0001, 0002 |
| 0004 | Docs sync + manual verification | AFK | 0003 |

0001 and 0002 are independent and can start in parallel.

---

## 0001 — Menu Phrase dictionary (`Action` enum + `matches`)

**Type:** AFK · **Blocked by:** None — can start immediately

### What to build

Collapse the four scattered localized-text tables (Watch Later, Save-to-playlist,
Remove-from menu items, plus the menu-button aria-labels) into one **Menu Phrase**
dictionary keyed by a named **Menu Action**, behind a pure checker. Then retrofit
the three existing inline matchers to call the checker — proving the dictionary
with no behaviour change. This slice is the iteration's pure test surface.

Scope:
- New file `menu-phrases.js`, loaded as a content script. CommonJS export guard
  at the bottom (same pattern as `helpers.js`) so `node:test` can require it.
- An `Action` enum / named-constant object: `WatchLater`, `SaveToPlaylist`,
  `RemoveFrom`, `MenuButton`. No bare action strings anywhere.
- One dictionary mapping each `Action` to its Menu Phrases across the supported
  languages. `MenuButton` stays at the 5 languages it has today — leave the gap
  vs the 10-language item actions **visible** in the table; do not fabricate the
  missing aria-label translations.
- A pure `matches(action, text) → boolean`: lowercases `text`, returns true when
  any of the action's Menu Phrases is a substring. No DOM access.
- Retrofit the three live matchers in `thumbnail-buttons.js` and
  `playlist-management.js` to use `matches(...)` instead of inline phrase arrays.
  This normalises the Remove matcher (today raw, un-lowercased) onto the shared
  lowercase convention.
- `menu-phrases.test.js` covering the checker.
- Add `menu-phrases.js` to the manifest `js` list **before** `thumbnail-buttons.js`.

### Acceptance criteria

- [x] `Action` is an enum of named constants; no inline action strings remain in the matchers.
- [x] All localized menu/aria phrases live in one dictionary in `menu-phrases.js`; the four inline tables are gone.
- [x] `matches(action, text)` is pure (no DOM), lowercases both sides, and is exported for `node:test`.
- [x] The three live matchers (Watch Later, Save-to-playlist, Remove-from) call `matches(...)`; behaviour is identical across the existing supported languages.
- [x] `MenuButton` phrases remain the same 5 languages as today; the gap is explicit in the dictionary, not filled with guesses.
- [x] `menu-phrases.test.js` covers: each action matches its own known phrases (incl. mixed case), does not match another action's phrases, and a non-matching string returns false.
- [x] `npm test` runs via `node:test` with no added dependencies.
- [x] No change to Quick-Add or Quick-Remove behaviour on a real YouTube page.

---

## 0002 — Action-button factories + feedback handle

**Type:** AFK · **Blocked by:** None — independent of 0001

### What to build

A button module owning the styling and the `⋯`/`✓`/`x` feedback state machine the
three buttons re-declare today. Two named factories produce a styled button plus a
handle exposing the lifecycle. Then retrofit the three button-creation sites to use
the factories — no behaviour change.

Scope:
- New file `action-buttons.js`, loaded as a content script (before
  `thumbnail-buttons.js`).
- `makeAddButton({ glyph, position, title, onClick, disabled })` → `{ el, pending,
  success, error }`. 32px dark style baked; hover (`scale(1.05)` + lighten) wired
  unless `disabled`; `errorGlyph` `x` baked. `disabled: true` renders the greyed,
  non-clickable empty state with a hint `title` and no `onClick` (the `★`
  empty-state behaviour).
- `makeRemoveButton({ position, onClick })` → same handle shape. 24px crimson style
  baked; `mousedown`/`dragstart` prevention baked (playlist items are draggable);
  idle glyph `x`, `errorGlyph` `!` baked.
- Handle semantics:
  - `pending()` → `⋯`, lightened bg.
  - `success()` → `✓`, locked terminal state (the `replaceWith(cloneNode)` listener
    kill). Add buttons only; Quick-Remove never calls it.
  - `error()` → flash the baked `errorGlyph` red, then **self-revert to idle after
    1500ms** (the timer lives in the module).
- The module produces the element and handle only. It does **not** find the
  container, set `position:relative`, or `appendChild` — insertion stays at the
  call site.
- Retrofit `addPlusButtonToThumbnail` (both `+` and `★`) and
  `addRemoveButtonToPlaylistItem` to build their buttons via the factories. The
  inline click-handler feedback pokes (`innerHTML`, `style`, clone trick, revert
  timers) are replaced by `handle.pending/success/error` calls.
- Add `action-buttons.js` to the manifest `js` list before `thumbnail-buttons.js`.

### Acceptance criteria

- [x] `makeAddButton` and `makeRemoveButton` exist and return `{ el, pending, success, error }`.
- [x] The `+`, `★`, and `x` buttons are created via the factories; the duplicated `cssText`/hover/feedback blocks are removed from the call sites.
- [x] `success()` shows `✓` and locks the button (terminal); only add buttons call it.
- [x] `error()` flashes the correct glyph (`x` for add, `!` for remove) and self-reverts to idle after 1500ms.
- [x] `makeAddButton({ disabled: true })` reproduces the `★` empty state: greyed, non-clickable, hint tooltip.
- [x] `makeRemoveButton` buttons do not start a drag on the playlist item.
- [ ] In-progress / success / error visual feedback is unchanged on all three buttons against a real page. *(manual — deferred to 0004 checklist)*
- [ ] Button sizes, colours, positions, and hover behaviour are visually identical to before. *(manual — deferred to 0004 checklist)*

---

## 0003 — Click-Simulation module + call-site rewrite

**Type:** AFK · **Blocked by:** 0001, 0002

### What to build

The deepening itself: one module owning the Click-Simulation spine, with three
click-sim-native verbs. The three click handlers are rewritten to `await` a verb
(whose item-matching runs through 0001's dictionary) and drive 0002's button handle
for feedback. The triplicated menu-open → poll → match → click sequence and the
nested `setTimeout`/`Date.now()` loops disappear from the call sites.

Scope:
- New file `click-simulation.js`, loaded as a content script before
  `thumbnail-buttons.js`.
- A private `waitFor(predicate, { timeout, interval })` returning a `Promise` that
  resolves when `predicate()` is truthy and rejects on timeout — replacing every
  `setTimeout` retry / `Date.now()` deadline loop.
- A private spine: locate the menu button (using `matches(Action.MenuButton, …)`
  plus the existing structural selectors), click it, `await waitFor` the popup,
  find the menu item via `matches(action, el.textContent)`, click it.
- Three verbs returning `Promise<void>` (resolve on success, reject on failure),
  touching **no** button state:
  - `addToWatchLater(thumbnail)` — spine with `Action.WatchLater`.
  - `addToPlaylist(thumbnail, name)` — spine with `Action.SaveToPlaylist`, then the
    modal step **inline**: `await` the modal, match the playlist by exact `name`,
    click it, dispatch Escape.
  - `removeFromCurrent(thumbnail)` — spine with `Action.RemoveFrom`.
- Rewrite the three click handlers in `thumbnail-buttons.js` /
  `playlist-management.js` to:
  `handle.pending()` → `await verb(...)` → `handle.success()` on resolve /
  `handle.error()` on reject. For Quick-Remove, the success path animates the
  parent item out and removes it (caller-side), and does **not** call `success()`.
- Video-id extraction stays via the existing `extractVideoId` helper.

### Acceptance criteria

- [x] `click-simulation.js` exports `addToWatchLater`, `addToPlaylist`, `removeFromCurrent`, each returning a `Promise<void>`.
- [x] The menu-open → poll → match → click sequence exists in exactly one place; the inline copies are gone from both call-site files.
- [x] No `setTimeout`-retry or `Date.now()`-deadline loops remain in the Click-Simulation paths; polling goes through `waitFor`.
- [x] The verbs touch no button/DOM-feedback state; the call sites drive `pending/success/error` off the returned promise.
- [ ] `★` saves to the configured Target Playlist (modal step inline), `+` saves to Watch Later, `x` removes from the viewed playlist — all identical to before, across the supported languages. *(manual — deferred to 0004 checklist)*
- [x] Quick-Remove still animates the item out caller-side and never calls `success()`.
- [x] `npm test` still passes (0001's dictionary tests).
- [x] Manifest load order places `click-simulation.js` before `thumbnail-buttons.js`.

---

## 0004 — Docs sync + manual verification

**Type:** AFK · **Blocked by:** 0003

### What to build

Bring the README in line with the new file layout and re-run the manual checklist
end-to-end, since the Click-Simulation paths are not covered by automated tests and
this iteration moved all three through new seams.

Scope:
- Update the README **Files** section: add `menu-phrases.js` (Menu Phrase
  dictionary + `Action` enum + `matches`), `action-buttons.js` (the two factories +
  feedback handle), and `click-simulation.js` (the three verbs + `waitFor`); update
  the descriptions of `thumbnail-buttons.js` and `playlist-management.js` to reflect
  that they now compose those modules rather than inline the logic.
- Note in the README dev section that the new automated coverage is the Menu Phrase
  checker (`menu-phrases.test.js`).
- Re-run the existing manual verification checklist against a live YouTube session,
  including at least one non-English UI, since every Click-Simulation path was
  rewired.

### Acceptance criteria

- [x] README Files section lists `menu-phrases.js`, `action-buttons.js`, and `click-simulation.js` with accurate one-line descriptions.
- [x] README no longer implies the matching/feedback/click-sim logic lives inline in `thumbnail-buttons.js` / `playlist-management.js`.
- [ ] The full manual verification checklist passes against live YouTube, including a non-English UI, with behaviour identical to pre-refactor. *(manual — requires a live YouTube session; checklist is in the README and ready to run)*
- [x] `npm test` passes.
