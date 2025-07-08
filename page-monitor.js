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

// Optimized URL change detection
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Clear cache on navigation
    processedThumbnails.clear();
    // Process new content immediately
    setTimeout(processNewThumbnails, 100); 
  }
});

// Function to initialize all monitoring
function initializeMonitoring() {
  // Initial execution
  waitForPageLoad();
  
  // Start observing for new thumbnails
  thumbnailObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Start URL change monitoring
  urlObserver.observe(document, { subtree: true, childList: true });
  
  // Reduced fallback check frequency
  setInterval(processNewThumbnails, 1000);
} 