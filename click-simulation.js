// Click-Simulation module: the single spine that drives YouTube's native menus by
// simulating clicks. Loaded as a content script (before thumbnail-buttons.js) where
// it defines its verbs as globals on `window`. A CommonJS export guard at the bottom
// (same pattern as helpers.js / menu-phrases.js) keeps it require-able.
//
// This module owns the menu-open → poll → match → click sequence that the three
// buttons used to inline three times over. It speaks click-sim-native verbs that
// return `Promise<void>` (resolve on success, reject on failure) and touch NO button
// state — the caller drives the ⋯/✓/x feedback off the returned promise. Item
// matching runs through the Menu Phrase dictionary (menu-phrases.js: `Action` /
// `matches`); both are globals here in content-script load order.

// Poll `predicate` every `interval` ms until it returns a truthy value (resolves
// with that value) or `timeout` ms elapse (rejects). This is the one place a
// setTimeout/Date.now polling loop lives — every call site awaits it instead of
// hand-rolling its own retry/deadline loop. A throwing predicate is treated as
// "not ready yet" rather than fatal.
function waitFor(predicate, { timeout = 2500, interval = 100 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      let result = null;
      try {
        result = predicate();
      } catch (_) {
        result = null;
      }
      if (result) {
        resolve(result);
      } else if (Date.now() - start >= timeout) {
        reject(new Error('waitFor: timed out'));
      } else {
        setTimeout(tick, interval);
      }
    };
    tick();
  });
}

// Locate the kebab/⋯ menu button for a thumbnail across the layouts we support,
// using the same structural selectors as before plus an aria-label fallback driven
// by the Menu Phrase dictionary. Covers the grid/lockup thumbnails (+ / ★) and the
// playlist-item dropdown (x); returns null when none is found.
function findMenuButton(thumbnail) {
  const container = thumbnail.closest('.yt-lockup-view-model-wiz') ||
    thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media, ytd-playlist-video-renderer');
  return container?.querySelector('.yt-lockup-metadata-view-model-wiz__menu-button button') ||
    container?.querySelector('yt-icon-button.dropdown-trigger button') ||
    Array.from(container?.querySelectorAll('button[aria-label]') || [])
      .find((b) => matches(Action.MenuButton, b.getAttribute('aria-label')));
}

// Find the still-open menu item whose visible text matches `action`, across the old
// and new menu renderers. Returns the item element or null.
function findMenuItem(action) {
  const items = Array.from(document.querySelectorAll(
    'ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model'
  ));
  return items.find((item) => matches(action, item.textContent || '')) || null;
}

// Click the actual interactive element inside a menu item, peeling through the
// renderer-specific wrappers and falling back to the item itself (the old/service
// renderer is clicked directly).
function clickMenuItem(item) {
  const clickable = item.querySelector('.yt-list-item-view-model__container') ||
    item.querySelector('.yt-list-item-view-model__label') ||
    item.querySelector('a.yt-simple-endpoint') ||
    item.querySelector('tp-yt-paper-item') ||
    item;
  clickable.click();
}

// The shared spine: find the menu button, click it, wait for the matching menu item
// to appear, click it. Rejects if the button is missing or the item never appears.
async function openMenuAndClick(thumbnail, action) {
  const menuButton = findMenuButton(thumbnail);
  if (!menuButton) {
    throw new Error('Menu button not found');
  }
  menuButton.click();
  const item = await waitFor(() => findMenuItem(action));
  clickMenuItem(item);
}

// `+` → Watch Later: the spine with the Watch Later action.
async function addToWatchLater(thumbnail) {
  await openMenuAndClick(thumbnail, Action.WatchLater);
}

// `★` → Target Playlist: the spine opens the "Save to playlist" modal, then the
// modal step runs inline here — wait for the playlist list, match by exact `name`,
// click it, and dispatch Escape to close the modal.
async function addToPlaylist(thumbnail, name) {
  await openMenuAndClick(thumbnail, Action.SaveToPlaylist);

  // Match a playlist row by its title. In the current modal layout the title is
  // the row's first <span> (a second <span> holds the privacy label, e.g.
  // "Publique"), so `.yt-list-item-view-model__title` is empty — read the first
  // span instead.
  const targetPlaylist = await waitFor(() => {
    const all = Array.from(document.querySelectorAll('toggleable-list-item-view-model'));
    return all.find((item) => {
      const title = item.querySelector('span');
      return title && title.textContent.trim() === name;
    }) || null;
  });

  // Click the row's interactive element to toggle the playlist. The old
  // `.yt-list-item-view-model__container` class is gone in this layout, so fall
  // back through likely candidates to the row itself.
  const clickable = targetPlaylist.querySelector('.yt-list-item-view-model__container') ||
    targetPlaylist.querySelector('[role="checkbox"], label, button') ||
    targetPlaylist;
  clickable.click();

  // Give YouTube time to register the toggle before closing the dialog — pressing
  // Escape too quickly cancels the save (the 300ms delay the old code relied on).
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Close the dialog by simulating an Escape key press.
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true,
  }));
}

// `x` → Quick-Remove: the spine with the Remove-from action. The caller animates the
// playlist item out on success; this verb only drives the menu click.
async function removeFromCurrent(thumbnail) {
  await openMenuAndClick(thumbnail, Action.RemoveFrom);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { waitFor, addToWatchLater, addToPlaylist, removeFromCurrent };
}
