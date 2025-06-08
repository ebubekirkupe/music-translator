import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

const server = createServer(app);

console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
console.log('-------------------');

server.listen(PORT, () => {
  console.log(`🎵 Music Translator API running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/`);
});