// Playlist-independent pure helpers shared by the content script and the unit
// tests. This file is loaded as a content script (where it defines globals on
// `window`) and is also required directly by `node:test` via the CommonJS
// export guard at the bottom — no bundler, no dependencies.

// Extract the video id from a YouTube watch URL.
// Returns the id string, or null when the input is not a string or carries no
// `v=` parameter.
function extractVideoId(href) {
  if (typeof href !== 'string') return null;
  const match = href.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// Decide whether a thumbnail should receive Quick-Add Buttons, given a plain
// descriptor of booleans (not live DOM nodes, so it is trivially testable).
// Mirrors the skip conditions the content script used to inline: Mix tiles,
// playlist tiles, Shorts, search-suggestion thumbnails, the video-player area,
// and playlist-header thumbnails are all ineligible.
function isEligibleThumbnail(descriptor) {
  const d = descriptor || {};
  if (d.hasMixBadge || d.hasPlaylistIndicator || d.isMixTitle ||
      d.hasPlaylistBadge || d.hasPlaylistMetadata || d.hasPlaylistLink ||
      d.isShortsVideo) {
    return false;
  }
  if (d.isPlaylistHeader) return false;
  if (d.isSearchSuggestion) return false;
  if (d.isVideoPlayer) return false;
  return true;
}

// Decide how Button 2 (the configured Target Playlist Quick-Add) should render,
// given the configured name (a plain string from chrome.storage.sync, or any
// non-string when unset). The button always renders so the feature stays
// discoverable; it is only enabled once a non-whitespace name is configured.
// `playlistName` is the trimmed name passed through for use as the save target
// and the hover tooltip.
function resolveButton2(config) {
  const trimmed = typeof config === 'string' ? config.trim() : '';
  return { render: true, enabled: trimmed.length > 0, playlistName: trimmed };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractVideoId, isEligibleThumbnail, resolveButton2 };
}
