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
      // Find the menu button in the playlist item
      const playlistItem = thumbnail.closest('ytd-playlist-video-renderer');
      const menuButton = playlistItem?.querySelector('ytd-menu-renderer .dropdown-trigger button');
      
      if (!menuButton) {
        console.error('Menu button not found for playlist item:', thumbnail);
        throw new Error('Menu button not found');
      }
      
      // Click menu button
      menuButton.click();
      
      // Wait for menu to appear and find remove option
      setTimeout(() => {
        // Find the "Remove from …" item by matching its visible text against the
        // shared Menu Phrase dictionary (Action.RemoveFrom), lowercased on both sides.
        const removeFromPlaylistButton = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer')).find(item => matches(Action.RemoveFrom, item.textContent || ''));
        
        if (removeFromPlaylistButton) {
          removeFromPlaylistButton.click();
          
          // Success feedback - hide the entire playlist item
          setTimeout(() => {
            const playlistItemElement = thumbnail.closest('ytd-playlist-video-renderer');
            if (playlistItemElement) {
              playlistItemElement.style.transition = 'opacity 0.3s ease, height 0.3s ease';
              playlistItemElement.style.opacity = '0';
              playlistItemElement.style.height = '0';
              playlistItemElement.style.overflow = 'hidden';
              playlistItemElement.style.marginBottom = '0';
              
              // Remove the element after animation
              setTimeout(() => {
                playlistItemElement.remove();
              }, 300);
            }
          }, 200);
        } else {
          console.error('Remove from playlist button not found in menu');
          throw new Error('Remove button not found');
        }
      }, 200);
      
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