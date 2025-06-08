import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import spotifyRoutes from './routes/spotifyRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'access_token']
}));
app.use(express.json());

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Music Translator API v2.0 🎵',
    version: '2.0.0',
    endpoints: [
      'GET / - API Info',
      'GET /health - Health check',
      'GET /spotify/login - Spotify OAuth',
      'GET /spotify/callback - OAuth callback',
      'GET /spotify/current - Current playing track',
      'GET /lyrics/search - Search lyrics',
      'GET /youtube/search - YouTube search',
      'GET /youtube-music/search - YouTube Music search'
    ]
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes will be added here
app.use('/spotify', spotifyRoutes);

// app.use('/lyrics', lyricsRoutes);
// app.use('/youtube', youtubeRoutes);
// app.use('/youtube-music', youtubeMusicRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

export default app;