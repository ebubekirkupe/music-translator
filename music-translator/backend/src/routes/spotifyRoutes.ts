import { Router } from 'express';
import { 
  getLoginUrl, 
  handleCallback, 
  getCurrentTrack,
  getCurrentTrackWithLyrics 
} from '../controllers/spotifyController';

const router = Router();

// Auth routes
router.get('/login', getLoginUrl);
router.get('/callback', handleCallback);

// Track routes
router.get('/current', getCurrentTrack);
router.get('/current-with-lyrics', getCurrentTrackWithLyrics);

export default router;