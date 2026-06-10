// YouTube Playlist Extension - Main Entry Point
// This extension adds buttons to YouTube thumbnails for managing playlists

// Single source of truth for the configured Target Playlist name. Read on load
// from chrome.storage.sync and kept current via an onChanged listener, so
// Button 2 reads the live value at click time — changing the name in the popup
// retargets the next ★ click without a page reload (the tooltip may lag until
// the next page load, which is accepted).
const TARGET_PLAYLIST_KEY = 'targetPlaylistName';
let targetPlaylistName = '';

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(TARGET_PLAYLIST_KEY, (result) => {
    // Tolerates set, empty-string, and unset values without throwing.
    targetPlaylistName = (result && result[TARGET_PLAYLIST_KEY]) || '';
    console.log('Target Playlist name loaded:', JSON.stringify(targetPlaylistName));
  });

  if (chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes[TARGET_PLAYLIST_KEY]) {
        targetPlaylistName = changes[TARGET_PLAYLIST_KEY].newValue || '';
        console.log('Target Playlist name updated:', JSON.stringify(targetPlaylistName));
      }
    });
  }
}

// Initialize the extension when the page loads
initializeMonitoring();

console.log('YouTube Playlist Extension loaded successfully!');
