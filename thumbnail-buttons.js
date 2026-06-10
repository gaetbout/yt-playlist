// Read the live DOM around a thumbnail into the plain descriptor consumed by
// the pure `isEligibleThumbnail` helper. Keeping the DOM reads here (and the
// decision in helpers.js) is what makes the eligibility rule unit-testable.
function describeThumbnail(thumbnail) {
  const itemContainer = thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
  return {
    hasMixBadge: !!itemContainer && !!itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('Mix'),
    hasPlaylistIndicator: !!itemContainer && !!(itemContainer.querySelector('a[href*="list="]') && !itemContainer.querySelector('a[href*="/watch?v="]')),
    isMixTitle: !!itemContainer && !!itemContainer.querySelector('h3')?.textContent?.includes('Mix'),
    hasPlaylistBadge: !!itemContainer && (!!itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('vidéos') ||
                                          !!itemContainer.querySelector('badge-shape-wiz__text')?.textContent?.includes('videos')),
    hasPlaylistMetadata: !!itemContainer && !!itemContainer.querySelector('.yt-content-metadata-view-model-wiz__metadata-text')?.textContent?.includes('Playlist'),
    hasPlaylistLink: !!itemContainer && !!itemContainer.querySelector('a[href*="/playlist?list="]'),
    isShortsVideo: !!itemContainer && !!(itemContainer.querySelector('a[href*="/shorts/"]') ||
                                         itemContainer.closest('ytd-reel-item-renderer') ||
                                         itemContainer.closest('ytd-rich-section-renderer[is-shorts]')),
    isPlaylistHeader: !!(thumbnail.closest('ytd-playlist-header-renderer') ||
                         thumbnail.closest('ytd-hero-playlist-thumbnail-renderer')),
    isSearchSuggestion: !!(thumbnail.closest('.ytSearchboxComponentSuggestionsContainer') ||
                           thumbnail.closest('.ytSuggestionComponentThumbnailContainer') ||
                           thumbnail.classList.contains('ytSuggestionComponentVisualSuggestThumbnail')),
    isVideoPlayer: !!(thumbnail.closest('ytd-watch-flexy, ytd-player, #movie_player, .html5-video-player') ||
                      thumbnail.closest('[id*="player"]') ||
                      thumbnail.closest('.video-stream') ||
                      (window.location.pathname.includes('/watch') && thumbnail.closest('#primary'))),
  };
}

// Function to add '+' button to a thumbnail
function addPlusButtonToThumbnail(thumbnail) {
  // Check if button already exists
  const existingButton = thumbnail.parentElement.querySelector('.yt-plus-button');
  if (existingButton) return;
  
  // Check whether we're viewing a playlist page (any playlist, not just Watch
  // Later) via the pure helper, and whether this thumbnail is a playlist item.
  const { isPlaylistPage } = getPlaylistContext(window.location.href);
  const isPlaylistVideoItem = thumbnail.closest('ytd-playlist-video-renderer');

  // On any playlist page, add the Quick-Remove button instead of plus buttons:
  // exactly one playlist is in view, so YouTube's native "Remove from …" item
  // is unambiguous.
  if (isPlaylistPage && isPlaylistVideoItem) {
    addRemoveButtonToPlaylistItem(thumbnail);
    return;
  }
  
  // Build a plain descriptor of skip conditions from the live DOM, then defer
  // the eligibility decision to the pure `isEligibleThumbnail` helper (shared
  // with the unit tests). Same semantics as the previous inline checks.
  if (!isEligibleThumbnail(describeThumbnail(thumbnail))) {
    return; // Skip Mix/playlist/Shorts/search-suggestion/player/header thumbnails
  }

  // Create the '+' button via the shared factory (32px dark style + hover +
  // ⋯/✓/x feedback handle baked in). Insertion stays at the call site below.
  const plusHandle = makeAddButton({
    glyph: '+',
    position: { top: '12px', right: '12px' },
    onClick: async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Immediate visual feedback
    plusHandle.pending();

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
      
      // Extract video ID from the link (shared pure helper)
      const videoId = extractVideoId(videoLink.href);
      if (!videoId) {
        console.error('Could not extract video ID from link:', videoLink.href);
        throw new Error('Could not extract video ID');
      }
      
      // Optimized: Find menu button more efficiently (support new main page layout)
      const itemContainerForMenu = thumbnail.closest('.yt-lockup-view-model-wiz') ||
                                   thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
      const menuButton = itemContainerForMenu?.querySelector('.yt-lockup-metadata-view-model-wiz__menu-button button') ||
                         itemContainerForMenu?.querySelector('yt-icon-button.dropdown-trigger button') ||
                         Array.from(itemContainerForMenu?.querySelectorAll('button[aria-label]') || []).find(b => matches(Action.MenuButton, b.getAttribute('aria-label')));
      
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
        const saveButton = allMenuItems.find(item => matches(Action.WatchLater, item.textContent || ''));
        
        if (saveButton) {
          const clickable = saveButton.querySelector('.yt-list-item-view-model__container') ||
                            saveButton.querySelector('.yt-list-item-view-model__label') ||
                            saveButton.querySelector('a.yt-simple-endpoint') ||
                            saveButton.querySelector('tp-yt-paper-item') ||
                            saveButton;
          clickable.click();
          // Success feedback — terminal ✓ + lock (handled by the factory).
          plusHandle.success();
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
      // Error feedback — flash x red, self-revert after 1500ms (factory).
      plusHandle.error();
    }
    },
  });
  const plusButton = plusHandle.el;
  plusButton.className = 'yt-plus-button';

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
  
  // Create Button 2: Quick-Add to the configured Target Playlist. The button
  // always renders (so the feature is discoverable), but is greyed-out and
  // non-clickable until a name is configured in the popup. resolveButton2 is the
  // pure helper that makes that decision; it is re-read at click time so popup
  // edits retarget the next save without a page reload.
  const button2Config = resolveButton2(typeof targetPlaylistName === 'string' ? targetPlaylistName : '');

  if (!button2Config.enabled) {
    // Disabled empty state: greyed-out, non-clickable, hint tooltip, no
    // hover/click handlers (the factory's `disabled: true` path).
    const disabledHandle = makeAddButton({
      glyph: '★',
      position: { top: '12px', right: '52px' },
      title: 'Set a Target Playlist name in the extension popup',
      disabled: true,
    });
    disabledHandle.el.className = 'yt-music-button';
    container.appendChild(disabledHandle.el);
    return;
  }

  // Enabled ★: tooltip shows the configured playlist name (may lag popup edits
  // until the next page load, which is accepted). Built via the same factory
  // (32px dark style + hover + ⋯/✓/x feedback handle).
  const musicHandle = makeAddButton({
    glyph: '★',
    position: { top: '12px', right: '52px' },
    title: button2Config.playlistName,
    onClick: async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Read the configured name at click time so popup edits take effect without
    // a page reload. Bail out if it was cleared since the button rendered.
    const { enabled: targetEnabled, playlistName: targetName } =
      resolveButton2(typeof targetPlaylistName === 'string' ? targetPlaylistName : '');
    if (!targetEnabled) {
      console.error('No Target Playlist configured; ignoring ★ click');
      return;
    }

    // Immediate visual feedback
    musicHandle.pending();

    try {
      // Find menu button (support new main page layout)
      const itemContainerForMusic = thumbnail.closest('.yt-lockup-view-model-wiz') ||
                                    thumbnail.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
      const menuButton = itemContainerForMusic?.querySelector('.yt-lockup-metadata-view-model-wiz__menu-button button') ||
                         itemContainerForMusic?.querySelector('yt-icon-button.dropdown-trigger button') ||
                         Array.from(itemContainerForMusic?.querySelectorAll('button[aria-label]') || []).find(b => matches(Action.MenuButton, b.getAttribute('aria-label')));
      
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
        const saveToPlaylistButton = allMenuItems.find(item => matches(Action.SaveToPlaylist, item.textContent || ''));
        
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
            // Look for the configured Target Playlist in the new dialog structure
            const allPlaylists = Array.from(document.querySelectorAll('toggleable-list-item-view-model'));
            const targetPlaylist = allPlaylists.find(item => {
              const titleSpan = item.querySelector('.yt-list-item-view-model__title');
              return titleSpan && titleSpan.textContent.trim() === targetName;
            });

            if (targetPlaylist) {
              // Find the clickable container
              const clickableItem = targetPlaylist.querySelector('.yt-list-item-view-model__container');
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
              
              // Success feedback — terminal ✓ + lock (factory).
              musicHandle.success();
            } else {
              console.error('Target Playlist not found in modal:', targetName);
              throw new Error('Target Playlist not found');
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
      console.error('Failed to add to Target Playlist:', error);
      // Error feedback — flash x red, self-revert after 1500ms (factory).
      musicHandle.error();
    }
    },
  });
  const musicButton = musicHandle.el;
  musicButton.className = 'yt-music-button';

  // Add the music button to the container
  container.appendChild(musicButton);
}