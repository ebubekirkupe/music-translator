import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import SpotifyService from '../services/SpotifyService';
import LyricsService from '../services/LyricsService';
import { Track, PlaybackState, LyricsResponse } from '../types';

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const { width: screenWidth } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [currentLyrics, setCurrentLyrics] = useState<LyricsResponse | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Turkish');
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSpotify();
    
    // Set up navigation header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={{ marginRight: 15 }}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
      SpotifyService.disconnect();
    };
  }, []);

  const initializeSpotify = async () => {
    try {
      const token = await AsyncStorage.getItem('spotify_access_token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      await SpotifyService.connect(token);
      startPlaybackMonitoring();
      setIsLoading(false);
    } catch (error) {
      console.error('Spotify init error:', error);
      Alert.alert('Connection Error', 'Failed to connect to Spotify');
      navigation.replace('Login');
    }
  };

  const startPlaybackMonitoring = () => {
    updatePlaybackState();
    updateInterval.current = setInterval(updatePlaybackState, 500);
  };

  const updatePlaybackState = async () => {
    try {
      const state = await SpotifyService.getPlaybackState();
      setPlaybackState(state);

      if (state?.track) {
        const lyrics = await LyricsService.getCurrentLyrics(
          state.track,
          state.position,
          selectedLanguage
        );
        setCurrentLyrics(lyrics);
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (playbackState?.isPlaying) {
        await SpotifyService.pause();
      } else {
        await SpotifyService.play();
      }
    } catch (error) {
      Alert.alert('Playback Error', 'Unable to control playback');
    }
  };

  const handleSkipNext = async () => {
    try {
      await SpotifyService.skipToNext();
    } catch (error) {
      Alert.alert('Skip Error', 'Unable to skip track');
    }
  };

  const handleSkipPrevious = async () => {
    try {
      await SpotifyService.skipToPrevious();
    } catch (error) {
      Alert.alert('Skip Error', 'Unable to skip track');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Connecting to Spotify...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {playbackState?.track ? (
          <>
            {/* Track Info */}
            <View style={styles.trackInfo}>
              {playbackState.track.albumImage && (
                <Image 
                  source={{ uri: playbackState.track.albumImage }}
                  style={styles.albumArt}
                />
              )}
              <Text style={styles.trackName}>{playbackState.track.name}</Text>
              <Text style={styles.artistName}>{playbackState.track.artist}</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${(playbackState.position / playbackState.track.duration) * 100}%` 
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={handleSkipPrevious}>
                <Text style={styles.controlButton}>⏮️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handlePlayPause}>
                <Text style={styles.playButton}>
                  {playbackState.isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSkipNext}>
                <Text style={styles.controlButton}>⏭️</Text>
              </TouchableOpacity>
            </View>

            {/* Lyrics Display */}
            <View style={styles.lyricsContainer}>
              {currentLyrics?.currentLyric ? (
                <View style={styles.currentLyric}>
                  <Text style={styles.lyricText}>
                    {currentLyrics.currentLyric.text}
                  </Text>
                  <Text style={styles.translationText}>
                    {currentLyrics.currentLyric.translation}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noLyrics}>No lyrics available</Text>
              )}

              {currentLyrics?.nextLyric && (
                <View style={styles.nextLyric}>
                  <Text style={styles.nextLyricText}>
                    {currentLyrics.nextLyric.text}
                  </Text>
                  <Text style={styles.nextTranslationText}>
                    {currentLyrics.nextLyric.translation}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noTrackContainer}>
            <Text style={styles.noTrackEmoji}>🎵</Text>
            <Text style={styles.noTrackText}>No track playing</Text>
            <Text style={styles.noTrackHint}>
              Start playing a song on Spotify!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  trackInfo: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  albumArt: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  trackName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  artistName: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 40,
  },
  controlButton: {
    fontSize: 35,
  },
  playButton: {
    fontSize: 50,
  },
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  currentLyric: {
    marginBottom: 30,
  },
  lyricText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: 10,
  },
  translationText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  nextLyric: {
    opacity: 0.5,
  },
  nextLyricText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextTranslationText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  noLyrics: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  noTrackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noTrackEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  noTrackText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  noTrackHint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MainScreen;