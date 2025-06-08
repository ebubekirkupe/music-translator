// Background service worker for Music Translator Extension

// Keep track of active connections
let activeTab = null;

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes('music.youtube.com')) {
    activeTab = tabId;
    console.log('YouTube Music tab detected:', tabId);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'track_update') {
    // Store current track info
    chrome.storage.local.set({ 
      currentTrack: message.track,
      lastUpdate: Date.now()
    });
  }
  
  return true;
});

// Open the web app when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ 
    url: 'https://fuzzy-space-giggle-ggvp59v599hv9gx-3000.app.github.dev' 
  });
});