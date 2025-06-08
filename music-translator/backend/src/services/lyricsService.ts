import axios from 'axios';

interface LRCLIBSearchResult {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

interface ParsedLyric {
  time: number; // milliseconds
  text: string;
}

interface SyncedLyricsData {
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  lyrics: ParsedLyric[];
  plainLyrics?: string;
}

export class LyricsService {
  private readonly baseUrl = 'https://lrclib.net/api';

  private parseLRC(lrcContent: string): ParsedLyric[] {
    const lines = lrcContent.split('\n');
    const lyrics: ParsedLyric[] = [];

    for (const line of lines) {
      const match = line.match(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)/);
      
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
        const text = match[4].trim();
        
        const totalMilliseconds = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
        
        if (text) {
          lyrics.push({
            time: totalMilliseconds,
            text: text
          });
        }
      }
    }

    return lyrics.sort((a, b) => a.time - b.time);
  }

  async searchLyrics(
    trackName: string, 
    artistName: string, 
    albumName?: string, 
    duration?: number
  ): Promise<LRCLIBSearchResult | null> {
    try {
      const params: any = {
        track_name: trackName,
        artist_name: artistName
      };

      if (albumName) params.album_name = albumName;
      if (duration) params.duration = Math.round(duration / 1000);

      console.log('LRCLIB Search params:', params);

      const response = await axios.get(`${this.baseUrl}/get`, { params });

      if (response.data && response.data.syncedLyrics) {
        console.log('LRCLIB: Found synced lyrics');
        return response.data;
      }

      // If exact match didn't work, try searching
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: { q: `${artistName} ${trackName}` }
      });

      if (searchResponse.data && searchResponse.data.length > 0) {
        const bestMatch = searchResponse.data.find((item: LRCLIBSearchResult) => 
          item.syncedLyrics !== null
        ) || searchResponse.data[0];

        console.log('LRCLIB: Found match in search results');
        return bestMatch;
      }

      return null;
    } catch (error) {
      console.error('LRCLIB search error:', error);
      return null;
    }
  }

  async getSyncedLyrics(
    trackName: string, 
    artistName: string, 
    albumName?: string, 
    duration?: number
  ): Promise<SyncedLyricsData | null> {
    try {
      const result = await this.searchLyrics(trackName, artistName, albumName, duration);

      if (!result) {
        return null;
      }

      if (!result.syncedLyrics) {
        console.log('No synced lyrics available, only plain lyrics');
        return {
          trackName: result.trackName,
          artistName: result.artistName,
          albumName: result.albumName,
          duration: result.duration * 1000,
          lyrics: [],
          plainLyrics: result.plainLyrics || undefined
        };
      }

      const parsedLyrics = this.parseLRC(result.syncedLyrics);

      return {
        trackName: result.trackName,
        artistName: result.artistName,
        albumName: result.albumName,
        duration: result.duration * 1000,
        lyrics: parsedLyrics,
        plainLyrics: result.plainLyrics || undefined
      };
    } catch (error) {
      console.error('Error getting synced lyrics:', error);
      return null;
    }
  }

  getCurrentLyric(lyrics: ParsedLyric[], currentTime: number): ParsedLyric | null {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].time <= currentTime) {
        return lyrics[i];
      }
    }
    return null;
  }

  getCurrentAndNextLyrics(
    lyrics: ParsedLyric[], 
    currentTime: number
  ): { current: ParsedLyric | null; next: ParsedLyric | null } {
    let current: ParsedLyric | null = null;
    let next: ParsedLyric | null = null;

    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) {
        current = lyrics[i];
        if (i + 1 < lyrics.length) {
          next = lyrics[i + 1];
        }
      } else {
        break;
      }
    }

    return { current, next };
  }
}