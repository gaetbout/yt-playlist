// Function to add remove button to playlist items (Watch Later)
function addRemoveButtonToPlaylistItem(thumbnail) {
  // Check if button already exists
  const existingButton = thumbnail.parentElement.querySelector('.yt-remove-button');
  if (existingButton) return;
  
  // Create the remove button
  const removeButton = document.createElement('button');
  removeButton.className = 'yt-remove-button';
  removeButton.innerHTML = '✗';
  removeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    background: rgba(220, 20, 60, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    transform: scale(1);
    pointer-events: auto;
  `;
  
  // Add hover effect
  removeButton.addEventListener('mouseenter', () => {
    removeButton.style.background = 'rgba(255, 69, 0, 0.9)';
    removeButton.style.transform = 'scale(1.05)';
  });
  
  removeButton.addEventListener('mouseleave', () => {
    removeButton.style.background = 'rgba(220, 20, 60, 0.8)';
    removeButton.style.transform = 'scale(1)';
  });
  
  // Prevent drag events from starting on the button
  removeButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  
  removeButton.addEventListener('dragstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Add click handler
  removeButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate visual feedback
    removeButton.innerHTML = '⋯';
    removeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    
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
        // Look for "Supprimer de" (Remove from) option in French
        const removeFromPlaylistButton = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer')).find(item => {
          const text = item.textContent;
          return text.includes('Supprimer de') ||
                 text.includes('Remove from') ||
                 text.includes('Eliminar de') ||
                 text.includes('Entfernen aus') ||
                 text.includes('Rimuovi da') ||
                 text.includes('から削除') ||
                 text.includes('에서 삭제') ||
                 text.includes('Remover de') ||
                 text.includes('Удалить из') ||
                 text.includes('إزالة من');
        });
        
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
      console.error('Failed to remove from Watch Later playlist:', error);
      // Error feedback
      removeButton.innerHTML = '!';
      removeButton.style.background = 'rgba(255, 0, 0, 0.8)';
      setTimeout(() => {
        removeButton.innerHTML = '✗';
        removeButton.style.background = 'rgba(220, 20, 60, 0.8)';
      }, 1500);
    }
  });
  
  // Find the thumbnail container specifically to avoid interfering with drag handles
  const thumbnailContainer = thumbnail.closest('ytd-thumbnail') || thumbnail.parentElement;
  
  // Make container relative if needed
  if (getComputedStyle(thumbnailContainer).position !== 'relative') {
    thumbnailContainer.style.position = 'relative';
  }
  
  // Add the button to the thumbnail container (not the whole playlist item)
  thumbnailContainer.appendChild(removeButton);
} 