// Function to add '+' button to a thumbnail
function addPlusButtonToThumbnail(thumbnail) {
  // Check if button already exists
  const existingButton = thumbnail.parentElement.querySelector('.yt-plus-button');
  if (existingButton) return;
  
  // Check if this is a Mix or playlist item (exclude these)
  const itemContainer = thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
  if (itemContainer) {
    // Check for Mix badge or playlist indicators
    const hasMixBadge = itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('Mix');
    const hasPlaylistIndicator = itemContainer.querySelector('a[href*="list="]') && !itemContainer.querySelector('a[href*="/watch?v="]');
    const isMixTitle = itemContainer.querySelector('h3')?.textContent?.includes('Mix');
    
    // Check for playlist badges and metadata
    const hasPlaylistBadge = itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('vidéos') || 
                            itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('videos');
    const hasPlaylistMetadata = itemContainer.querySelector('.yt-content-metadata-view-model-wiz__metadata-text')?.textContent?.includes('Playlist');
    const hasPlaylistLink = itemContainer.querySelector('a[href*="/playlist?list="]');
    
    // Check for Shorts indicators
    const isShortsVideo = itemContainer.querySelector('a[href*="/shorts/"]') || 
                         itemContainer.closest('ytd-reel-item-renderer') ||
                         itemContainer.closest('ytd-rich-section-renderer[is-shorts]');
    
    if (hasMixBadge || hasPlaylistIndicator || isMixTitle || hasPlaylistBadge || hasPlaylistMetadata || hasPlaylistLink || isShortsVideo) {
      return; // Skip Mix/playlist/Shorts items
    }
  }
  
  // Check if this is a playlist header thumbnail (exclude these)
  const isPlaylistHeader = thumbnail.closest('ytd-playlist-header-renderer') || 
                          thumbnail.closest('ytd-hero-playlist-thumbnail-renderer');
  
  if (isPlaylistHeader) {
    return; // Skip playlist header thumbnails
  }
  
  // Create the '+' button
  const plusButton = document.createElement('button');
  plusButton.className = 'yt-plus-button';
  plusButton.innerHTML = '+';
  plusButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    transform: scale(1);
  `;
  
  // Add hover effect
  plusButton.addEventListener('mouseenter', () => {
    plusButton.style.background = 'rgba(255, 255, 255, 0.2)';
    plusButton.style.transform = 'scale(1.05)';
  });
  
  plusButton.addEventListener('mouseleave', () => {
    plusButton.style.background = 'rgba(0, 0, 0, 0.8)';
    plusButton.style.transform = 'scale(1)';
  });
  
  // Add click handler
  plusButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate visual feedback
    plusButton.innerHTML = '⋯';
    plusButton.style.background = 'rgba(255, 255, 255, 0.3)';
    
    try {
      // Optimized: Find the video link more efficiently
      const videoLink = thumbnail.closest('a[href*="/watch?v="]') || 
                       thumbnail.parentElement.querySelector('a[href*="/watch?v="]') ||
                       thumbnail.closest('ytd-rich-item-renderer')?.querySelector('a[href*="/watch?v="]') ||
                       thumbnail.closest('ytd-video-renderer')?.querySelector('a[href*="/watch?v="]') ||
                       thumbnail.closest('ytd-compact-video-renderer')?.querySelector('a[href*="/watch?v="]') ||
                       thumbnail.closest('ytd-grid-video-renderer')?.querySelector('a[href*="/watch?v="]');
      
      if (!videoLink) {
        throw new Error('Could not find video link');
      }
      
      // Extract video ID from the link
      const videoIdMatch = videoLink.href.match(/[?&]v=([^&]+)/);
      if (!videoIdMatch) {
        throw new Error('Could not extract video ID');
      }
      
      const videoId = videoIdMatch[1];
      
      // Optimized: Find menu button more efficiently
      const menuButton = thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer')?.querySelector('yt-icon-button.dropdown-trigger button');
      
      if (!menuButton) {
        throw new Error('Menu button not found');
      }
      
      // Click menu button
      menuButton.click();
      
      // Reduced timeout and optimized menu search
      setTimeout(() => {
        // More specific selector for save button
        const saveButton = document.querySelector('ytd-menu-service-item-renderer[aria-label*="tard"], ytd-menu-service-item-renderer[aria-label*="Save"], ytd-menu-service-item-renderer[aria-label*="Guardar"]') ||
                          Array.from(document.querySelectorAll('ytd-menu-service-item-renderer')).find(item => 
                            item.textContent.includes('regarder plus tard') || 
                            item.textContent.includes('Save to Watch Later') ||
                            item.textContent.includes('Guardar para ver más tarde') ||
                            item.textContent.includes('Speichern für später') ||
                            item.textContent.includes('Salva per guardare più tardi') ||
                            item.textContent.includes('保存して後で見る') ||
                            item.textContent.includes('나중에 볼 동영상에 저장') ||
                            item.textContent.includes('Salvar para assistir mais tarde') ||
                            item.textContent.includes('Сохранить для просмотра позже') ||
                            item.textContent.includes('حفظ للمشاهدة لاحقًا')
                          );
        
        if (saveButton) {
          saveButton.click();
          // Success feedback - disable button with gray appearance
          plusButton.innerHTML = '✓';
          plusButton.style.background = 'rgba(0, 0, 0, 0.4)';
          plusButton.style.cursor = 'default';
          plusButton.disabled = true;
          
          // Remove hover effects by removing event listeners
          plusButton.replaceWith(plusButton.cloneNode(true));
        } else {
          throw new Error('Save button not found');
        }
      }, 200); // Reduced from 500ms to 200ms
      
    } catch (error) {
      // Error feedback
      plusButton.innerHTML = '✗';
      plusButton.style.background = 'rgba(255, 0, 0, 0.8)';
      setTimeout(() => {
        plusButton.innerHTML = '+';
        plusButton.style.background = 'rgba(0, 0, 0, 0.8)';
      }, 1500);
    }
  });
  
  // Optimized: Find container more efficiently
  const container = thumbnail.closest('[style*="position: relative"], [style*="position:relative"]') || 
                   thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer') ||
                   thumbnail.parentElement;
  
  // Make container relative if needed
  if (getComputedStyle(container).position !== 'relative') {
    container.style.position = 'relative';
  }
  
  // Add the button to the container
  container.appendChild(plusButton);
  
  // Create the music button for "Musique" playlist
  const musicButton = document.createElement('button');
  musicButton.className = 'yt-music-button';
  musicButton.innerHTML = '♪';
  musicButton.style.cssText = `
    position: absolute;
    top: 52px;
    right: 12px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    transform: scale(1);
  `;
  
  // Add hover effect for music button
  musicButton.addEventListener('mouseenter', () => {
    musicButton.style.background = 'rgba(255, 255, 255, 0.2)';
    musicButton.style.transform = 'scale(1.05)';
  });
  
  musicButton.addEventListener('mouseleave', () => {
    musicButton.style.background = 'rgba(0, 0, 0, 0.8)';
    musicButton.style.transform = 'scale(1)';
  });
  
  // Add click handler for music button
  musicButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate visual feedback
    musicButton.innerHTML = '⋯';
    musicButton.style.background = 'rgba(255, 255, 255, 0.3)';
    
    try {
      // Find menu button
      const menuButton = thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer')?.querySelector('yt-icon-button.dropdown-trigger button');
      
      if (!menuButton) {
        throw new Error('Menu button not found');
      }
      
      // Click menu button
      menuButton.click();
      
      setTimeout(() => {
        // Look for "Save to playlist" option in the dropdown menu
        const saveToPlaylistButton = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer')).find(item => 
          item.textContent.includes('Enregistrer dans une playlist') ||
          item.textContent.includes('Save to playlist') ||
          item.textContent.includes('Guardar en lista de reproducción') ||
          item.textContent.includes('In Playlist speichern') ||
          item.textContent.includes('Salva nella playlist') ||
          item.textContent.includes('プレイリストに保存') ||
          item.textContent.includes('재생목록에 저장') ||
          item.textContent.includes('Salvar na playlist') ||
          item.textContent.includes('Сохранить в плейлист') ||
          item.textContent.includes('حفظ في قائمة التشغيل')
        );
        
        if (saveToPlaylistButton) {
          // Click "Save to playlist" to open the playlist modal
          saveToPlaylistButton.click();
          
          // Wait longer for the playlist modal to fully load
          setTimeout(() => {
            // Look for "Musique" playlist in the modal
            const musiquePlaylist = Array.from(document.querySelectorAll('ytd-playlist-add-to-option-renderer, .ytd-playlist-add-to-option-renderer')).find(playlist => 
              playlist.textContent.includes('Musique')
            );
            
            if (musiquePlaylist) {
              // Find the checkbox and click it if not already checked
              const checkbox = musiquePlaylist.querySelector('tp-yt-paper-checkbox, input[type="checkbox"], [role="checkbox"]');
              if (checkbox) {
                // Check if it's already checked (avoid double-clicking)
                const isChecked = checkbox.checked || checkbox.getAttribute('aria-checked') === 'true' || checkbox.classList.contains('checked');
                if (!isChecked) {
                  checkbox.click();
                }
              }
              
              // Close the modal by clicking outside or finding close button
              setTimeout(() => {
                const closeButton = document.querySelector('tp-yt-iron-dropdown[opened] tp-yt-paper-dialog .close-button, #close-button, [aria-label*="Close"], [aria-label*="Fermer"]');
                if (closeButton) {
                  closeButton.click();
                } else {
                  // Click outside the modal to close it
                  document.body.click();
                }
              }, 100);
              
              // Success feedback
              musicButton.innerHTML = '♪';
              musicButton.style.background = 'rgba(0, 0, 0, 0.4)';
              musicButton.style.cursor = 'default';
              musicButton.disabled = true;
              
              // Remove hover effects
              musicButton.replaceWith(musicButton.cloneNode(true));
            } else {
              throw new Error('Musique playlist not found');
            }
          }, 500); // Increased timeout for modal to load
        } else {
          throw new Error('Save to playlist button not found');
        }
      }, 200);
      
    } catch (error) {
      // Error feedback
      musicButton.innerHTML = '✗';
      musicButton.style.background = 'rgba(255, 0, 0, 0.8)';
      setTimeout(() => {
        musicButton.innerHTML = '♪';
        musicButton.style.background = 'rgba(0, 0, 0, 0.8)';
      }, 1500);
    }
  });
  
  // Add the music button to the container
  container.appendChild(musicButton);
}

// Cache for processed thumbnails to avoid duplicates
const processedThumbnails = new WeakSet();

// Function to process new thumbnails efficiently
function processNewThumbnails() {
  const thumbnailSelectors = [
    'ytd-thumbnail img[src*="i.ytimg.com"]', // Most specific first
    'img[src*="i.ytimg.com"]', 
    'img[src*="ytimg.com"]'
  ];
  
  let processedCount = 0;
  
  thumbnailSelectors.forEach(selector => {
    const thumbnails = document.querySelectorAll(selector);
    thumbnails.forEach(thumbnail => {
      // Skip if already processed or invalid
      if (processedThumbnails.has(thumbnail) || !thumbnail.src || thumbnail.width === 0 || thumbnail.height === 0) {
        return;
      }
      
      // Mark as processed
      processedThumbnails.add(thumbnail);
      
      // Add plus button to this thumbnail
      addPlusButtonToThumbnail(thumbnail);
      processedCount++;
    });
  });
  
  return processedCount;
}

// Function to wait for page to be fully loaded and then process thumbnails
function waitForPageLoad() {
  // Process immediately if page is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    processNewThumbnails();
  } else {
    // Wait for DOM content loaded
    document.addEventListener('DOMContentLoaded', processNewThumbnails, { once: true });
  }
  
  // Also wait for window load as backup
  if (document.readyState !== 'complete') {
    window.addEventListener('load', processNewThumbnails, { once: true });
  }
}

// Initial execution
waitForPageLoad();

// Optimized MutationObserver with debouncing
let processingTimeout = null;
const thumbnailObserver = new MutationObserver((mutations) => {
  let hasNewThumbnails = false;
  
  // Quick check for new thumbnails
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if node is or contains thumbnails
        if (node.matches && node.matches('img[src*="i.ytimg.com"]')) {
          hasNewThumbnails = true;
          break;
        }
        
        if (node.querySelector && node.querySelector('img[src*="i.ytimg.com"]')) {
          hasNewThumbnails = true;
          break;
        }
      }
    }
    if (hasNewThumbnails) break;
  }
  
  // Debounce processing to avoid excessive calls
  if (hasNewThumbnails) {
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }
    processingTimeout = setTimeout(() => {
      requestAnimationFrame(processNewThumbnails);
    }, 50); // Very short delay for responsiveness
  }
});

// Start observing for new thumbnails
thumbnailObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Optimized URL change detection
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Clear cache on navigation
    processedThumbnails.clear();
    // Process new content immediately
    setTimeout(processNewThumbnails, 100); // Reduced from 1000ms to 100ms
  }
}).observe(document, { subtree: true, childList: true });

// Reduced fallback check frequency
setInterval(processNewThumbnails, 1000); // Reduced from 10 seconds to 5 seconds 