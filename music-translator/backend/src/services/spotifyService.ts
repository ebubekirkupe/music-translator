import axios from 'axios';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

interface CurrentTrackInfo {
  id: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  albumImage?: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
  timestamp: string;
}

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly apiBaseUrl = 'https://api.spotify.com/v1';
  private readonly authUrl = 'https://accounts.spotify.com';

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('⚠️ Spotify credentials missing! Check your .env file');
    }
  }

  getAuthURL(): string {
    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-read-recently-played',
      'user-read-playback-position'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      show_dialog: 'false'
    });

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<SpotifyTokenResponse> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        `${this.authUrl}/api/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Spotify token error:', error);
      throw new Error('Failed to get Spotify access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        `${this.authUrl}/api/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to refresh Spotify access token');
    }
  }

  async getCurrentlyPlaying(accessToken: string): Promise<CurrentTrackInfo | null> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/me/player/currently-playing`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            additional_types: 'track,episode',
          },
        }
      );

      if (response.status === 204 || !response.data || !response.data.item) {
        return null;
      }

      const { item: track, progress_ms, is_playing } = response.data;

      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        artists: track.artists.map((a: any) => a.name),
        album: track.album.name,
        albumImage: track.album.images[0]?.url,
        duration: track.duration_ms,
        progress: progress_ms,
        isPlaying: is_playing,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Access token expired or invalid');
      }
      throw new Error('Failed to get current track from Spotify');
    }
  }
}