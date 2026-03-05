import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { saveExploredPosition } from './storageService';
import type { ExploredArea, LocationUpdate } from '../types/location';
import {
  LOCATION_TASK_NAME,
  LOCATION_UPDATE_DISTANCE,
  LOCATION_DEFERRED_UPDATES_INTERVAL,
  EXPLORATION_RADIUS,
  MAX_GPS_ACCURACY,
} from '../utils/constants';

// This callback will be set by the app to receive location updates in the foreground
let locationUpdateCallback: ((location: LocationUpdate) => void) | null = null;

/**
 * Process a location update (called from both foreground and background)
 */
async function processLocationUpdate(location: Location.LocationObject): Promise<void> {
  try {
    const { latitude, longitude, accuracy, speed, heading } = location.coords;
    const timestamp = location.timestamp;

    console.log(`[Location] Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, accuracy: ${accuracy?.toFixed(1)}m`);

    // Filter out inaccurate readings
    if (accuracy && accuracy > MAX_GPS_ACCURACY) {
      console.log(`[Location] Rejected: accuracy ${accuracy}m > ${MAX_GPS_ACCURACY}m`);
      return;
    }

    const locationUpdate: LocationUpdate = {
      latitude,
      longitude,
      timestamp,
      accuracy: accuracy || 999,
      speed: speed || undefined,
      heading: heading || undefined,
    };

    // Notify foreground callback if set (for real-time UI updates)
    if (locationUpdateCallback) {
      locationUpdateCallback(locationUpdate);
    }

    // Save to storage (background context)
    const exploredArea: ExploredArea = {
      latitude,
      longitude,
      timestamp,
      radius: EXPLORATION_RADIUS,
      accuracy: accuracy || undefined,
    };

    saveExploredPosition(exploredArea);
  } catch (error) {
    console.error('[Location] Error processing update:', error);
  }
}

/**
 * Define the background location task
 * This runs even when the app is closed/backgrounded
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Location] Background task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    if (locations && locations.length > 0) {
      console.log(`[Location] Background: received ${locations.length} location(s)`);

      // Process each location update
      for (const location of locations) {
        await processLocationUpdate(location);
      }
    }
  }
});

/**
 * Check if location services are enabled on the device
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('[Location] Error checking location services:', error);
    return false;
  }
}

/**
 * Check if we have foreground location permission
 */
export async function hasForegroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Location] Error checking foreground permission:', error);
    return false;
  }
}

/**
 * Check if we have background location permission
 */
export async function hasBackgroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Location] Error checking background permission:', error);
    return false;
  }
}

/**
 * Request foreground location permission
 */
export async function requestForegroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('[Location] Foreground permission:', status);
    return status === 'granted';
  } catch (error) {
    console.error('[Location] Error requesting foreground permission:', error);
    return false;
  }
}

/**
 * Request background location permission
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    console.log('[Location] Background permission:', status);
    return status === 'granted';
  } catch (error) {
    console.error('[Location] Error requesting background permission:', error);
    return false;
  }
}

/**
 * Check if background location tracking is currently running
 */
export async function isTrackingActive(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isRegistered;
  } catch (error) {
    console.error('[Location] Error checking tracking status:', error);
    return false;
  }
}

/**
 * Start background location tracking
 */
export async function startLocationTracking(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if location services are enabled
    const locationEnabled = await isLocationEnabled();
    if (!locationEnabled) {
      return {
        success: false,
        error: 'Location services are disabled. Please enable them in device settings.',
      };
    }

    // Check if foreground permission is granted
    const hasForeground = await hasForegroundPermission();
    if (!hasForeground) {
      const granted = await requestForegroundPermission();
      if (!granted) {
        return {
          success: false,
          error: 'Foreground location permission is required.',
        };
      }
    }

    // Check if background permission is granted
    const hasBackground = await hasBackgroundPermission();
    if (!hasBackground) {
      const granted = await requestBackgroundPermission();
      if (!granted) {
        return {
          success: false,
          error: 'Background location permission is required for continuous tracking.',
        };
      }
    }

    // Check if already tracking
    const isActive = await isTrackingActive();
    if (isActive) {
      console.log('[Location] Tracking already active');
      return { success: true };
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: LOCATION_UPDATE_DISTANCE, // Update every 5 meters
      deferredUpdatesInterval: LOCATION_DEFERRED_UPDATES_INTERVAL, // Batch updates
      showsBackgroundLocationIndicator: Platform.OS === 'ios', // Show blue bar on iOS
      foregroundService: Platform.OS === 'android' ? {
        notificationTitle: 'Map Explorer Active',
        notificationBody: 'Discovering new areas as you move...',
        notificationColor: '#4CAF50',
      } : undefined,
    });

    console.log('[Location] Background tracking started');
    return { success: true };
  } catch (error) {
    console.error('[Location] Error starting tracking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stop background location tracking
 */
export async function stopLocationTracking(): Promise<void> {
  try {
    const isActive = await isTrackingActive();
    if (!isActive) {
      console.log('[Location] Tracking not active');
      return;
    }

    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[Location] Background tracking stopped');
  } catch (error) {
    console.error('[Location] Error stopping tracking:', error);
  }
}

/**
 * Get current location (one-time)
 */
export async function getCurrentLocation(): Promise<LocationUpdate | null> {
  try {
    const hasForeground = await hasForegroundPermission();
    if (!hasForeground) {
      console.log('[Location] No foreground permission for getCurrentLocation');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy || 999,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
    };
  } catch (error) {
    console.error('[Location] Error getting current location:', error);
    return null;
  }
}

/**
 * Set a callback for foreground location updates
 * This allows the UI to update in real-time
 */
export function setLocationUpdateCallback(callback: (location: LocationUpdate) => void): void {
  locationUpdateCallback = callback;
}

/**
 * Clear the location update callback
 */
export function clearLocationUpdateCallback(): void {
  locationUpdateCallback = null;
}

/**
 * Start foreground location watching (for when app is in foreground)
 */
export async function startForegroundLocationWatch(
  callback: (location: LocationUpdate) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const hasForeground = await hasForegroundPermission();
    if (!hasForeground) {
      console.log('[Location] No foreground permission for watching');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: LOCATION_UPDATE_DISTANCE,
      },
      (location) => {
        const locationUpdate: LocationUpdate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || 999,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        };
        callback(locationUpdate);
      }
    );

    console.log('[Location] Foreground watch started');
    return subscription;
  } catch (error) {
    console.error('[Location] Error starting foreground watch:', error);
    return null;
  }
}
