// YouTube Music Player Observer
let currentTrack = null;
let ws = null;
let isConnected = false;

// WebSocket connection to backend
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket('wss://fuzzy-space-giggle-ggvp59v599hv9gx-3001.app.github.dev');
  
  ws.onopen = () => {
    console.log('Music Translator: Connected to backend');
    isConnected = true;
    
    // Send authentication if needed
    ws.send(JSON.stringify({
      type: 'youtube_music_connect',
      source: 'extension'
    }));
  };

  ws.onclose = () => {
    console.log('Music Translator: Disconnected');
    isConnected = false;
    // Reconnect after 5 seconds
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('Music Translator: WebSocket error', error);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'lyrics_update') {
      // Handle lyrics update if needed
      console.log('Lyrics update:', data);
    }
  };
}

// Get current playing track info
function getCurrentTrack() {
  const titleElement = document.querySelector('.title.ytmusic-player-bar');
  const artistElement = document.querySelector('.byline.ytmusic-player-bar a');
  const progressBar = document.querySelector('#progress-bar');
  const timeInfo = document.querySelector('.time-info.ytmusic-player-bar');
  
  if (!titleElement || !artistElement) return null;

  // Parse time
  let currentTime = 0;
  let duration = 0;
  
  if (timeInfo) {
    const timeText = timeInfo.textContent;
    const times = timeText.split('/').map(t => t.trim());
    if (times.length === 2) {
      currentTime = parseTime(times[0]);
      duration = parseTime(times[1]);
    }
  }

  // Get video ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');

  return {
    title: titleElement.textContent.trim(),
    artist: artistElement.textContent.trim(),
    videoId: videoId,
    currentTime: currentTime,
    duration: duration,
    isPlaying: isPlaying()
  };
}

// Parse time string to milliseconds
function parseTime(timeStr) {
  const parts = timeStr.split(':').reverse();
  let ms = 0;
  if (parts[0]) ms += parseInt(parts[0]) * 1000; // seconds
  if (parts[1]) ms += parseInt(parts[1]) * 60 * 1000; // minutes
  if (parts[2]) ms += parseInt(parts[2]) * 60 * 60 * 1000; // hours
  return ms;
}

// Check if music is playing
function isPlaying() {
  const playButton = document.querySelector('.play-pause-button');
  return playButton && playButton.getAttribute('aria-label') === 'Pause';
}

// Send track update to backend
function sendTrackUpdate() {
  const track = getCurrentTrack();
  
  if (!track || !isConnected) return;
  
  // Check if track changed
  if (!currentTrack || 
      currentTrack.title !== track.title || 
      currentTrack.artist !== track.artist) {
    currentTrack = track;
    console.log('Music Translator: New track detected', track);
  }

  // Send update
  ws.send(JSON.stringify({
    type: 'track_update',
    track: track,
    timestamp: Date.now()
  }));
}

// Initialize observer
function initializeObserver() {
  // Connect WebSocket
  connectWebSocket();

  // Watch for player changes
  const observer = new MutationObserver(() => {
    sendTrackUpdate();
  });

  // Observe player bar
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (playerBar) {
    observer.observe(playerBar, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Update every 500ms for progress
  setInterval(() => {
    if (isPlaying()) {
      sendTrackUpdate();
    }
  }, 500);
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
  // Delay to ensure YouTube Music is loaded
  setTimeout(initializeObserver, 2000);
}

console.log('Music Translator: Extension loaded for YouTube Music');