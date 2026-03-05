import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useExplorationStore } from './src/stores/explorationStore';
import { PermissionGuard } from './src/components/UI/PermissionGuard';
import { ExplorationMapView } from './src/components/Map/MapView';
import { ExplorationStats } from './src/components/UI/ExplorationStats';
import {
  startLocationTracking,
  startForegroundLocationWatch,
  getCurrentLocation,
} from './src/services/locationService';
import type { LocationUpdate } from './src/types/location';

export default function App() {
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const loadData = useExplorationStore((state) => state.loadData);
  const addPosition = useExplorationStore((state) => state.addPosition);
  const updateCurrentLocation = useExplorationStore((state) => state.updateCurrentLocation);
  const clearData = useExplorationStore((state) => state.clearData);
  const refreshStats = useExplorationStore((state) => state.refreshStats);

  // Load exploration data on mount
  useEffect(() => {
    console.log('[App] Loading exploration data...');
    loadData();
  }, []);

  // Start location tracking when permissions are granted
  useEffect(() => {
    let mounted = true;

    const initializeLocationTracking = async () => {
      try {
        // Get current location immediately
        const currentLoc = await getCurrentLocation();
        if (currentLoc && mounted) {
          updateCurrentLocation(currentLoc);
          console.log('[App] Initial location obtained');
        }

        // Start background location tracking
        const result = await startLocationTracking();
        if (result.success) {
          console.log('[App] Background location tracking started');
        } else {
          console.warn('[App] Background tracking failed:', result.error);
        }

        // Start foreground location watching for real-time UI updates
        const subscription = await startForegroundLocationWatch((location: LocationUpdate) => {
          if (mounted) {
            updateCurrentLocation(location);
            addPosition(location);
          }
        });

        if (subscription && mounted) {
          setLocationSubscription(subscription);
          console.log('[App] Foreground location watch started');
        }
      } catch (error) {
        console.error('[App] Error initializing location tracking:', error);
      }
    };

    // Small delay to ensure permissions are ready
    const timeoutId = setTimeout(() => {
      initializeLocationTracking();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all exploration data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearData();
            Alert.alert('Success', 'All exploration data has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PermissionGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.container}>
            <ExplorationMapView />

            {/* Stats Overlay */}
            <View style={styles.statsContainer}>
              <ExplorationStats onClearData={handleClearData} />
            </View>

            <StatusBar style="dark" />
          </View>
        </SafeAreaView>
      </PermissionGuard>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});
