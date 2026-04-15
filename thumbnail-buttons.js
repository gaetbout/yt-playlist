// Function to add '+' button to a thumbnail
function addPlusButtonToThumbnail(thumbnail) {
  // Check if button already exists
  const existingButton = thumbnail.parentElement.querySelector('.yt-plus-button');
  if (existingButton) return;
  
  // Check if we're on the Watch Later playlist page
  const isWatchLaterPage = window.location.href.includes('/playlist?list=WL') || 
                          window.location.href.includes('list=WL');
  
  // Check if this is a playlist video item (Watch Later context)
  const isPlaylistVideoItem = thumbnail.closest('ytd-playlist-video-renderer');
  
  // If we're on Watch Later playlist, add remove button instead of plus button
  if (isWatchLaterPage && isPlaylistVideoItem) {
    addRemoveButtonToPlaylistItem(thumbnail);
    return;
  }
  
  // Check if this is a Mix or playlist item (exclude these)
  const itemContainer = thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
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
  
  // Check if this is in search suggestions dropdown (exclude these)
  const isSearchSuggestion = thumbnail.closest('.ytSearchboxComponentSuggestionsContainer') ||
                            thumbnail.closest('.ytSuggestionComponentThumbnailContainer') ||
                            thumbnail.classList.contains('ytSuggestionComponentVisualSuggestThumbnail');
  
  if (isSearchSuggestion) {
    return; // Skip search suggestion thumbnails
  }
  
  // Check if this is in the video player area (exclude these)
  const isVideoPlayer = thumbnail.closest('ytd-watch-flexy, ytd-player, #movie_player, .html5-video-player') ||
                       thumbnail.closest('[id*="player"]') ||
                       thumbnail.closest('.video-stream') ||
                       (window.location.pathname.includes('/watch') && thumbnail.closest('#primary'));
  
  if (isVideoPlayer) {
    return; // Skip video player thumbnails
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
    background: rgba(0, 0, 0, 0.3);
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
    plusButton.style.background = 'rgba(255, 255, 255, 0.15)';
    plusButton.style.transform = 'scale(1.05)';
  });
  
  plusButton.addEventListener('mouseleave', () => {
    plusButton.style.background = 'rgba(0, 0, 0, 0.3)';
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
                       thumbnail.closest('ytd-grid-video-renderer')?.querySelector('a[href*="/watch?v="]') ||
                       thumbnail.closest('ytd-rich-grid-media')?.querySelector('a[href*="/watch?v="]');
      
      if (!videoLink) {
        console.error('Could not find video link for thumbnail:', thumbnail);
        throw new Error('Could not find video link');
      }
      
      // Extract video ID from the link
      const videoIdMatch = videoLink.href.match(/[?&]v=([^&]+)/);
      if (!videoIdMatch) {
        console.error('Could not extract video ID from link:', videoLink.href);
        throw new Error('Could not extract video ID');
      }
      
      const videoId = videoIdMatch[1];
      
      // Optimized: Find menu button more efficiently (support new main page layout)
      const itemContainerForMenu = thumbnail.closest('.yt-lockup-view-model-wiz') ||
                                   thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
      const menuButton = itemContainerForMenu?.querySelector('.yt-lockup-metadata-view-model-wiz__menu-button button') ||
                         itemContainerForMenu?.querySelector('yt-icon-button.dropdown-trigger button') ||
                         itemContainerForMenu?.querySelector('button[aria-label*="Autres actions"], button[aria-label*="More actions"], button[aria-label*="Más acciones"], button[aria-label*="Weitere Aktionen"], button[aria-label*="Altre azioni"]');
      
      if (!menuButton) {
        console.error('Menu button not found for thumbnail:', thumbnail);
        throw new Error('Menu button not found');
      }
      
      // Click menu button
      menuButton.click();
      
      // Wait for the menu to appear, then click "Watch Later"
      const startTimeWL = Date.now();
      const tryFindWatchLater = () => {
        // Ensure the popup is open (support new sheet layout)
        const popupOpen = document.querySelector('ytd-menu-popup-renderer, tp-yt-iron-dropdown[opened], yt-sheet-view-model.yt-sheet-view-model-wiz');
        // Look for the Watch Later item across old and new renderers
        const allMenuItems = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model'));
        const saveButton = allMenuItems.find(item => {
          const text = (item.textContent || '').toLowerCase();
          return text.includes('regarder plus tard') ||
                 text.includes('watch later') ||
                 text.includes('guardar para ver más tarde') ||
                 text.includes('speichern für später') ||
                 text.includes('salva per guardare più tardi') ||
                 text.includes('保存して後で見る') ||
                 text.includes('나중에 볼 동영상에 저장') ||
                 text.includes('salvar para assistir mais tarde') ||
                 text.includes('сохранить для просмотра позже') ||
                 text.includes('حفظ للمشاهدة لاحقًا');
        });
        
        if (saveButton) {
          const clickable = saveButton.querySelector('.yt-list-item-view-model__container') ||
                            saveButton.querySelector('.yt-list-item-view-model__label') ||
                            saveButton.querySelector('a.yt-simple-endpoint') ||
                            saveButton.querySelector('tp-yt-paper-item') ||
                            saveButton;
          clickable.click();
          // Success feedback - disable button with gray appearance
          plusButton.innerHTML = '✓';
          plusButton.style.background = 'rgba(0, 0, 0, 0.4)';
          plusButton.style.cursor = 'default';
          plusButton.disabled = true;
          
          // Remove hover effects by removing event listeners
          plusButton.replaceWith(plusButton.cloneNode(true));
        } else if (!popupOpen || Date.now() - startTimeWL > 2500) {
          console.error('Save to Watch Later button not found in menu');
          throw new Error('Save button not found');
        } else {
          setTimeout(tryFindWatchLater, 100);
        }
      };
      setTimeout(tryFindWatchLater, 200);
      
    } catch (error) {
      console.error('Failed to add to Watch Later playlist:', error);
      // Error feedback
      plusButton.innerHTML = 'x';
      plusButton.style.background = 'rgba(255, 0, 0, 0.3)';
      setTimeout(() => {
        plusButton.innerHTML = '+';
        plusButton.style.background = 'rgba(0, 0, 0, 0.3)';
      }, 1500);
    }
  });
  
  // Optimized: Find container more efficiently
  const container = thumbnail.closest('[style*="position: relative"], [style*="position:relative"]') || 
                   thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media') ||
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
    top: 12px;
    right: 52px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.3);
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
    musicButton.style.background = 'rgba(255, 255, 255, 0.15)';
    musicButton.style.transform = 'scale(1.05)';
  });
  
  musicButton.addEventListener('mouseleave', () => {
    musicButton.style.background = 'rgba(0, 0, 0, 0.3)';
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
      // Find menu button (support new main page layout)
      const itemContainerForMusic = thumbnail.closest('.yt-lockup-view-model-wiz') ||
                                    thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
      const menuButton = itemContainerForMusic?.querySelector('.yt-lockup-metadata-view-model-wiz__menu-button button') ||
                         itemContainerForMusic?.querySelector('yt-icon-button.dropdown-trigger button') ||
                         itemContainerForMusic?.querySelector('button[aria-label*="Autres actions"], button[aria-label*="More actions"], button[aria-label*="Más acciones"], button[aria-label*="Weitere Aktionen"], button[aria-label*="Altre azioni"]');
      
      if (!menuButton) {
        console.error('Menu button not found for music playlist operation:', thumbnail);
        throw new Error('Menu button not found');
      }
      
      // Click menu button
      menuButton.click();
      
      // Wait for the menu to appear, then click "Save to playlist"
      const startTimeSP = Date.now();
      const tryFindSaveToPlaylist = () => {
        const popupOpen = document.querySelector('ytd-menu-popup-renderer, tp-yt-iron-dropdown[opened], yt-sheet-view-model.yt-sheet-view-model-wiz');
        // Look for "Save to playlist" option across old and new renderers
        const allMenuItems = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model'));
        const saveToPlaylistButton = allMenuItems.find(item => {
          const text = (item.textContent || '').toLowerCase();
          return text.includes('enregistrer dans une playlist') ||
                 text.includes('save to playlist') ||
                 text.includes('guardar en lista de reproducción') ||
                 text.includes('in playlist speichern') ||
                 text.includes('salva nella playlist') ||
                 text.includes('プレイリストに保存') ||
                 text.includes('재생목록에 저장') ||
                 text.includes('salvar na playlist') ||
                 text.includes('сохранить в плейлист') ||
                 text.includes('حفظ في قائمة التشغيل');
        });
        
        if (saveToPlaylistButton) {
          // Click "Save to playlist" to open the playlist modal
          const clickableElement = saveToPlaylistButton.querySelector('.yt-list-item-view-model__container') ||
                                   saveToPlaylistButton.querySelector('.yt-list-item-view-model__label') ||
                                   saveToPlaylistButton.querySelector('a.yt-simple-endpoint') || 
                                   saveToPlaylistButton.querySelector('tp-yt-paper-item') ||
                                   saveToPlaylistButton;
          clickableElement.click();
          
          // Wait longer for the playlist modal to fully load
          setTimeout(() => {
            // Look for "Musique" playlist in the new dialog structure
            const allPlaylists = Array.from(document.querySelectorAll('toggleable-list-item-view-model'));
            const musiquePlaylist = allPlaylists.find(item => {
              const titleSpan = item.querySelector('.yt-list-item-view-model__title');
              return titleSpan && titleSpan.textContent.trim() === 'Musique';
            });
            
            if (musiquePlaylist) {
              // Find the clickable container
              const clickableItem = musiquePlaylist.querySelector('.yt-list-item-view-model__container');
              if (clickableItem) {
                clickableItem.click();
              }
              
              // Close the dialog by simulating Escape key press
              setTimeout(() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'Escape',
                  code: 'Escape',
                  keyCode: 27,
                  which: 27,
                  bubbles: true,
                  cancelable: true
                });
                document.dispatchEvent(event);
              }, 300);
              
              // Success feedback
              musicButton.innerHTML = '♪';
              musicButton.style.background = 'rgba(0, 0, 0, 0.4)';
              musicButton.style.cursor = 'default';
              musicButton.disabled = true;
              
              // Remove hover effects
              musicButton.replaceWith(musicButton.cloneNode(true));
            } else {
              console.error('Musique playlist not found in modal');
              throw new Error('Musique playlist not found');
            }
          }, 700);
        } else if (!popupOpen || Date.now() - startTimeSP > 2500) {
          console.error('Save to playlist button not found in menu');
          throw new Error('Save to playlist button not found');
        } else {
          setTimeout(tryFindSaveToPlaylist, 100);
        }
      };
      setTimeout(tryFindSaveToPlaylist, 250);
      
    } catch (error) {
      console.error('Failed to add to Musique playlist:', error);
      // Error feedback
      musicButton.innerHTML = 'x';
      musicButton.style.background = 'rgba(255, 0, 0, 0.3)';
      setTimeout(() => {
        musicButton.innerHTML = '♪';
        musicButton.style.background = 'rgba(0, 0, 0, 0.3)';
      }, 1500);
    }
  });
  
  // Add the music button to the container
  container.appendChild(musicButton);
} 