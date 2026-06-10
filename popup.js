// Popup for configuring the Target Playlist name. The name is stored in
// chrome.storage.sync as a single plain string under TARGET_PLAYLIST_KEY, so it
// persists across browser restarts and syncs across machines on the same
// Google account.

const TARGET_PLAYLIST_KEY = 'targetPlaylistName';

const input = document.getElementById('playlist-name');
const saveButton = document.getElementById('save');
const status = document.getElementById('status');

// Load the previously saved name when the popup opens.
chrome.storage.sync.get(TARGET_PLAYLIST_KEY, (result) => {
  input.value = result[TARGET_PLAYLIST_KEY] || '';
});

saveButton.addEventListener('click', () => {
  const name = input.value.trim();
  chrome.storage.sync.set({ [TARGET_PLAYLIST_KEY]: name }, () => {
    status.textContent = 'Saved';
    setTimeout(() => { status.textContent = ''; }, 1500);
  });
});

// Allow pressing Enter in the field to save.
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveButton.click();
});
