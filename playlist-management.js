// Function to add remove button to playlist items (Watch Later)
function addRemoveButtonToPlaylistItem(thumbnail) {
  // Check if button already exists
  const existingButton = thumbnail.parentElement.querySelector('.yt-remove-button');
  if (existingButton) return;
  
  // Create the remove button via the shared factory (24px crimson style + hover
  // + drag prevention + ⋯/!/idle feedback handle baked in). Quick-Remove never
  // calls success() — the item is animated out caller-side on the success path.
  const removeHandle = makeRemoveButton({
    position: { top: '6px', right: '6px' },
    onClick: async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Immediate visual feedback
    removeHandle.pending();

    try {
      // Drive the Click-Simulation verb (menu open → match "Remove from …" → click
      // lives in the module). Quick-Remove never calls success(): on resolve the
      // success path animates the parent item out and removes it caller-side.
      await removeFromCurrent(thumbnail);

      const playlistItemElement = thumbnail.closest('ytd-playlist-video-renderer');
      if (playlistItemElement) {
        playlistItemElement.style.transition = 'opacity 0.3s ease, height 0.3s ease';
        playlistItemElement.style.opacity = '0';
        playlistItemElement.style.height = '0';
        playlistItemElement.style.overflow = 'hidden';
        playlistItemElement.style.marginBottom = '0';

        // Remove the element after the fade/collapse animation.
        setTimeout(() => {
          playlistItemElement.remove();
        }, 300);
      }

    } catch (error) {
      console.error('Failed to remove from playlist:', error);
      // Error feedback — flash ! red, self-revert after 1500ms (factory).
      removeHandle.error();
    }
    },
  });
  const removeButton = removeHandle.el;
  removeButton.className = 'yt-remove-button';

  // Find the thumbnail container specifically to avoid interfering with drag handles
  const thumbnailContainer = thumbnail.closest('ytd-thumbnail') || thumbnail.parentElement;
  
  // Make container relative if needed
  if (getComputedStyle(thumbnailContainer).position !== 'relative') {
    thumbnailContainer.style.position = 'relative';
  }
  
  // Add the button to the thumbnail container (not the whole playlist item)
  thumbnailContainer.appendChild(removeButton);
} 