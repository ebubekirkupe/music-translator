import { Request, Response } from 'express';
import { SpotifyService } from '../services/spotifyService';
import { LyricsService } from '../services/lyricsService';
import { TranslationService } from '../services/translationService';

const spotifyService = new SpotifyService();
const lyricsService = new LyricsService();
const translationService = new TranslationService();

export const getLoginUrl = (req: Request, res: Response): void => {
  try {
    const authUrl = spotifyService.getAuthURL();
    res.json({
      message: 'Spotify login URL created',
      login_url: authUrl,
      instructions: 'Visit this URL to authorize the app'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create login URL' });
  }
};

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Authorization code missing' });
      return;
    }

    const tokenData = await spotifyService.getAccessToken(code);
    
    res.json({
      message: 'Successfully authorized!',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Failed to get access token' });
  }
};

export const getCurrentTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || req.headers.access_token;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const accessToken = typeof authHeader === 'string' 
      ? authHeader.replace('Bearer ', '') 
      : authHeader.toString();

    const currentTrack = await spotifyService.getCurrentlyPlaying(accessToken);
    
    res.json({
      success: true,
      data: currentTrack
    });
  } catch (error: any) {
    if (error.message.includes('expired')) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Failed to get current track' });
    }
  }
};

export const getCurrentTrackWithLyrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || req.headers.access_token;
    const { lang = 'Turkish' } = req.query;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const accessToken = typeof authHeader === 'string' 
      ? authHeader.replace('Bearer ', '') 
      : authHeader.toString();

    // Get current track
    const currentTrack = await spotifyService.getCurrentlyPlaying(accessToken);
    
    if (!currentTrack) {
      res.json({
        success: false,
        message: 'No track currently playing'
      });
      return;
    }

    // Get lyrics
    const syncedLyrics = await lyricsService.getSyncedLyrics(
      currentTrack.name,
      currentTrack.artist,
      currentTrack.album,
      currentTrack.duration
    );

    if (!syncedLyrics || syncedLyrics.lyrics.length === 0) {
      res.json({
        success: true,
        track: currentTrack,
        lyrics: null
      });
      return;
    }

    // Get current and next lyrics
    const { current, next } = lyricsService.getCurrentAndNextLyrics(
      syncedLyrics.lyrics,
      currentTrack.progress
    );

    // Translate if needed
    let currentTranslation = null;
    let nextTranslation = null;

    if (current) {
      currentTranslation = await translationService.translateLine(
        current.text,
        lang as string
      );
    }

    if (next) {
      nextTranslation = await translationService.translateLine(
        next.text,
        lang as string
      );
    }

    res.json({
      success: true,
      track: currentTrack,
      currentLyric: current ? {
        text: current.text,
        translation: currentTranslation,
        time: current.time
      } : null,
      nextLyric: next ? {
        text: next.text,
        translation: nextTranslation,
        time: next.time
      } : null,
      language: lang
    });

  } catch (error: any) {
    console.error('Error:', error);
    if (error.message.includes('expired')) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Failed to get lyrics' });
    }
  }
};