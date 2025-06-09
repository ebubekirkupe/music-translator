import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import SpotifyAuth from '../services/SpotifyAuth';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('spotify_access_token');
      if (token) {
        // Validate token by making a test request
        navigation.replace('Main');
      }
    } catch (error) {
      console.log('No existing token');
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      const result = await SpotifyAuth.authorize();
      if (result.accessToken) {
        await AsyncStorage.setItem('spotify_access_token', result.accessToken);
        if (result.refreshToken) {
          await AsyncStorage.setItem('spotify_refresh_token', result.refreshToken);
        }
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        'Unable to connect to Spotify. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>Music Translator</Text>
          <Text style={styles.subtitle}>
            Real-time lyrics translation for Spotify
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <FeatureItem 
            icon="🎤" 
            text="Synchronized lyrics display" 
          />
          <FeatureItem 
            icon="🌍" 
            text="Translate to 10+ languages" 
          />
          <FeatureItem 
            icon="⚡" 
            text="Real-time translation" 
          />
          <FeatureItem 
            icon="🎮" 
            text="Control playback" 
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleSpotifyLogin}
          activeOpacity={0.8}
        >
          <Image 
            source={require('../assets/spotify-icon.png')}
            style={styles.spotifyIcon}
            defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111624.png' }}
          />
          <Text style={styles.loginButtonText}>Login with Spotify</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Spotify Premium required for playback control
        </Text>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 50,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
  },
  loginButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spotifyIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#fff',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    position: 'absolute',
    bottom: 30,
  },
});

export default LoginScreen;