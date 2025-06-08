import React, { useState, useEffect } from 'react';
import './App.css';
import { API_BASE_URL } from './config/api';

interface Track {
  name: string;
  artist: string;
  album: string;
  albumImage?: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

interface Lyric {
  text: string;
  translation: string | null;
  time: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentLyric, setCurrentLyric] = useState<Lyric | null>(null);
  const [nextLyric, setNextLyric] = useState<Lyric | null>(null);
  const [language, setLanguage] = useState('Turkish');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // YouTube additions
  const [platform, setPlatform] = useState<'spotify' | 'youtube'>('spotify');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Check for access token in URL (callback)
  useEffect(() => {
    console.log('Current URL:', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('Got authorization code:', code);
      handleSpotifyCallback(code);
    } else {
      // Check localStorage for existing token
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        console.log('Found saved token');
        setAccessToken(savedToken);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Handle Spotify OAuth callback
  const handleSpotifyCallback = async (code: string) => {
    try {
      setIsLoading(true);
      console.log('Exchanging code for token...');
      
      const response = await fetch(`${API_BASE_URL}/spotify/callback?code=${code}`);
      const data = await response.json();
      
      console.log('Token response:', data);
      
      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, '/');
      } else {
        setError('Failed to get access token');
      }
    } catch (err) {
      setError('Failed to authenticate with Spotify');
      console.error('Callback error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Spotify login URL
  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Getting login URL...');
      const response = await fetch(`${API_BASE_URL}/spotify/login`);
      const data = await response.json();
      
      console.log('Login response:', data);
      
      if (data.login_url) {
        console.log('Redirecting to:', data.login_url);
        window.location.href = data.login_url;
      } else {
        setError('No login URL received');
      }
    } catch (err) {
      setError('Failed to get Spotify login URL');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current lyrics
  const fetchCurrentLyrics = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/synced-lyrics/current-line?lang=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 401) {
        // Token expired
        setIsAuthenticated(false);
        setAccessToken(null);
        localStorage.removeItem('spotify_access_token');
        setError('Session expired. Please login again.');
        return;
      }

      const data = await response.json();
      
      if (data.success && data.track) {
        setCurrentTrack(data.track);
        setCurrentLyric(data.currentLyric);
        setNextLyric(data.nextLyric);
        setError(null);
      } else {
        setCurrentTrack(null);
        setCurrentLyric(null);
        setNextLyric(null);
      }
    } catch (err) {
      console.error('Failed to fetch lyrics:', err);
    }
  };

  // Auto-refresh lyrics
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Initial fetch
    fetchCurrentLyrics();

    // Refresh every 500ms
    const interval = setInterval(fetchCurrentLyrics, 500);

    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken, language]);

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setCurrentTrack(null);
    setCurrentLyric(null);
    setNextLyric(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  };

  // YouTube Music search function
  const searchYouTubeMusic = async () => {
    if (!youtubeSearchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/youtube-music/search?q=${encodeURIComponent(youtubeSearchQuery)}&lang=${language}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setYoutubeResults(data);
        if (!data.lyrics) {
          setError('No lyrics found for this song');
        }
      } else {
        setError(data.message || 'No results found');
      }
    } catch (err) {
      setError('Failed to search YouTube Music');
      console.error('YouTube Music search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Language selector
  const languages = [
    'Turkish', 'English', 'Spanish', 'French', 
    'German', 'Italian', 'Portuguese', 'Japanese'
  ];

  // Loading screen
  if (isLoading) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>🎵 Music Translator</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen with platform selection
  if (!isAuthenticated && platform === 'spotify') {
    return (
      <div className="App">
        <div className="login-container">
          <h1>🎵 Music Translator</h1>
          <p>Translate song lyrics in real-time while listening</p>
          
          <div className="platform-selector">
            <button 
              className={`platform-btn ${platform === 'spotify' ? 'active' : ''}`}
              onClick={() => setPlatform('spotify')}
            >
              Spotify
            </button>
            <button 
              className={`platform-btn ${platform === 'youtube' ? 'active' : ''}`}
              onClick={() => setPlatform('youtube')}
            >
              YouTube
            </button>
          </div>
          
          <button 
            onClick={handleSpotifyLogin} 
            className="spotify-login-btn"
            disabled={isLoading}
          >
            Login with Spotify
          </button>
          
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  // Login screen for YouTube
  if (!isAuthenticated && platform === 'youtube') {
    return (
      <div className="App">
        <div className="login-container">
          <h1>🎵 Music Translator</h1>
          <p>Translate song lyrics in real-time while listening</p>
          
          <div className="platform-selector">
            <button 
              className={`platform-btn ${platform === 'spotify' ? 'active' : ''}`}
              onClick={() => setPlatform('spotify')}
            >
              Spotify
            </button>
            <button 
              className={`platform-btn ${platform === 'youtube' ? 'active' : ''}`}
              onClick={() => {
                setPlatform('youtube');
                setIsAuthenticated(true); // YouTube Music doesn't need auth
              }}
            >
              YouTube Music
            </button>
          </div>
          
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  // YouTube mode
  if (platform === 'youtube') {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🎵 Music Translator - YouTube Music</h1>
          <div className="controls">
            <button 
              onClick={() => {
                setPlatform('spotify');
                setIsAuthenticated(false);
              }} 
              className="platform-switch-btn"
            >
              Switch to Spotify
            </button>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="main-content">
          <div className="youtube-search">
            <input
              type="text"
              placeholder="Search for a song (e.g., Blessd - Mírame)"
              value={youtubeSearchQuery}
              onChange={(e) => setYoutubeSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchYouTubeMusic()}
              className="youtube-search-input"
            />
            <button 
              onClick={searchYouTubeMusic} 
              disabled={isSearching}
              className="youtube-search-btn"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {youtubeResults && (
            <div className="youtube-results">
              {youtubeResults.track && (
                <div className="video-info">
                  {youtubeResults.track.thumbnail && (
                    <img 
                      src={youtubeResults.track.thumbnail} 
                      alt={youtubeResults.track.name}
                      className="video-thumbnail"
                    />
                  )}
                  <div className="video-details">
                    <h2>{youtubeResults.track.title}</h2>
                    <p>{youtubeResults.track.artist}</p>
                    {youtubeResults.track.album && (
                      <p className="album-name">Album: {youtubeResults.track.album}</p>
                    )}
                  </div>
                </div>
              )}

              {youtubeResults.lyrics ? (
                <div className="lyrics-preview">
                  <h3>Lyrics Preview (First 10 lines)</h3>
                  {youtubeResults.lyrics.synced.map((lyric: any, index: number) => (
                    <div key={index} className="lyric-line">
                      <p className="lyric-text">{lyric.text}</p>
                      <p className="lyric-translation">{lyric.translation || '...'}</p>
                    </div>
                  ))}
                  <p className="lyrics-info">
                    Total lines: {youtubeResults.lyrics.total}
                  </p>
                </div>
              ) : (
                <div className="no-lyrics">
                  <p>No synchronized lyrics found for this song</p>
                </div>
              )}

              {youtubeResults.allResults && youtubeResults.allResults.length > 1 && (
                <div className="other-results">
                  <h3>Other results:</h3>
                  {youtubeResults.allResults.slice(1).map((result: any, index: number) => (
                    <div key={index} className="result-item">
                      <span>{result.title} - {result.artist}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="error">{error}</p>}
        </main>
      </div>
    );
  }

  // Main app
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎵 Music Translator</h1>
        <div className="controls">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="main-content">
        {currentTrack ? (
          <div className="track-info">
            {currentTrack.albumImage && (
              <img 
                src={currentTrack.albumImage} 
                alt={currentTrack.album}
                className="album-art"
              />
            )}
            <div className="track-details">
              <h2>{currentTrack.name}</h2>
              <p>{currentTrack.artist}</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(currentTrack.progress / currentTrack.duration) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="no-track">
            <p>No track playing</p>
            <p className="hint">Start playing a song on Spotify!</p>
          </div>
        )}

        <div className="lyrics-container">
          {currentLyric && (
            <div className="current-lyric">
              <p className="lyric-text">{currentLyric.text}</p>
              <p className="lyric-translation">{currentLyric.translation || '...'}</p>
            </div>
          )}
          
          {nextLyric && (
            <div className="next-lyric">
              <p className="lyric-text">{nextLyric.text}</p>
              <p className="lyric-translation">{nextLyric.translation || '...'}</p>
            </div>
          )}
          
          {!currentLyric && !nextLyric && currentTrack && (
            <div className="no-lyrics">
              <p>No synchronized lyrics available for this track</p>
            </div>
          )}
        </div>
      </main>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;