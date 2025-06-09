export interface Track {
  id: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  albumImage?: string;
  duration: number;
  uri: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  track: Track | null;
}

export interface Lyric {
  time: number;
  text: string;
  translation?: string;
}

export interface LyricsResponse {
  success: boolean;
  track?: Track;
  currentLyric?: {
    text: string;
    translation: string;
    time: number;
  };
  nextLyric?: {
    text: string;
    translation: string;
    time: number;
  };
  language?: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  images: Array<{
    url: string;
  }>;
}