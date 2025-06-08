// Get current tab and check connection
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  
  if (tab.url && tab.url.includes('music.youtube.com')) {
    document.getElementById('status').textContent = 'Connected to YouTube Music';
    document.getElementById('status').className = 'status connected';
    
    // Get current track info from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getCurrentTrack' }, (response) => {
      if (response && response.track) {
        document.getElementById('currentTrack').style.display = 'block';
        document.getElementById('trackTitle').textContent = response.track.title;
        document.getElementById('trackArtist').textContent = response.track.artist;
      }
    });
  } else {
    document.getElementById('status').textContent = 'Please open YouTube Music';
    document.getElementById('status').className = 'status disconnected';
  }
});

// Open app button
document.getElementById('openApp').addEventListener('click', () => {
  window.open('https://fuzzy-space-giggle-ggvp59v599hv9gx-3000.app.github.dev');
});