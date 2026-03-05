import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {
  isLocationEnabled,
  hasForegroundPermission,
  hasBackgroundPermission,
  requestForegroundPermission,
  requestBackgroundPermission,
} from '../../services/locationService';

interface PermissionGuardProps {
  children: React.ReactNode;
}

type PermissionState = 'checking' | 'location-disabled' | 'need-foreground' | 'need-background' | 'granted';

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ children }) => {
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermissions = async () => {
    setPermissionState('checking');

    // Check if location services are enabled
    const locationEnabled = await isLocationEnabled();
    if (!locationEnabled) {
      setPermissionState('location-disabled');
      return;
    }

    // Check foreground permission
    const hasForeground = await hasForegroundPermission();
    if (!hasForeground) {
      setPermissionState('need-foreground');
      return;
    }

    // Check background permission
    const hasBackground = await hasBackgroundPermission();
    if (!hasBackground) {
      setPermissionState('need-background');
      return;
    }

    setPermissionState('granted');
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleRequestForeground = async () => {
    setIsRequesting(true);
    const granted = await requestForegroundPermission();
    setIsRequesting(false);

    if (granted) {
      checkPermissions();
    }
  };

  const handleRequestBackground = async () => {
    setIsRequesting(true);
    const granted = await requestBackgroundPermission();
    setIsRequesting(false);

    if (granted) {
      checkPermissions();
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (permissionState === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (permissionState === 'location-disabled') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Location Services Disabled</Text>
        <Text style={styles.description}>
          Please enable Location Services in your device settings to use Map Explorer.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={checkPermissions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (permissionState === 'need-foreground') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Location Permission Required</Text>
        <Text style={styles.description}>
          Map Explorer needs access to your location to reveal the map as you explore.
        </Text>
        <TouchableOpacity
          style={[styles.button, isRequesting && styles.buttonDisabled]}
          onPress={handleRequestForeground}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Grant Location Access</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (permissionState === 'need-background') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.title}>Background Location</Text>
        <Text style={styles.description}>
          To continue revealing the map even when the app is closed, we need background location access.
          {'\n\n'}
          {Platform.OS === 'ios'
            ? 'Please select "Always Allow" when prompted.'
            : 'Please select "Allow all the time" when prompted.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, isRequesting && styles.buttonDisabled]}
          onPress={handleRequestBackground}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Enable Background Tracking</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setPermissionState('granted')}
        >
          <Text style={styles.skipButtonText}>Skip (Foreground Only)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Permission granted - render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 400,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
