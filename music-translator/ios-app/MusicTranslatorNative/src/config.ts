export const Config = {
  // API URLs
  API_BASE_URL: __DEV__ 
    ? 'http://localhost:3001' 
    : 'https://your-production-api.com',
  
  // Spotify Config
  SPOTIFY_CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID',
  SPOTIFY_REDIRECT_URL: 'musictranslator://spotify-callback',
  SPOTIFY_SCOPES: [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-playback-position',
    'user-modify-playback-state',
    'streaming',
    'app-remote-control'
  ],
  
  // App Config
  LYRICS_REFRESH_INTERVAL: 500, // ms
  SUPPORTED_LANGUAGES: [
    { code: 'tr', name: 'Turkish' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ]
};