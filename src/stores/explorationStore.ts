import { create } from 'zustand';
import type { ExploredArea, ExplorationBounds, LocationUpdate } from '../types/location';
import {
  loadExplorationData,
  saveExploredPosition,
  clearExplorationData,
  getExplorationStats,
  isTrackingEnabled,
  setTrackingEnabled,
  type ExplorationStats,
} from '../services/storageService';
import { isSignificantMovement } from '../utils/geoUtils';
import { MIN_DISTANCE_BETWEEN_UPDATES, MAX_GPS_ACCURACY } from '../utils/constants';

interface ExplorationState {
  // Data
  exploredCells: Set<string>;
  positions: ExploredArea[];
  bounds: ExplorationBounds | null;
  currentLocation: LocationUpdate | null;
  lastSavedPosition: ExploredArea | null;

  // UI State
  isLoading: boolean;
  isTracking: boolean;
  stats: ExplorationStats;

  // Actions
  loadData: () => void;
  addPosition: (location: LocationUpdate) => void;
  updateCurrentLocation: (location: LocationUpdate) => void;
  clearData: () => void;
  refreshStats: () => void;
  setTracking: (enabled: boolean) => void;
}

export const useExplorationStore = create<ExplorationState>((set, get) => ({
  // Initial state
  exploredCells: new Set(),
  positions: [],
  bounds: null,
  currentLocation: null,
  lastSavedPosition: null,
  isLoading: true,
  isTracking: isTrackingEnabled(),
  stats: {
    totalPositions: 0,
    totalCells: 0,
    exploredAreaSqMeters: 0,
    firstExplorationDate: null,
    lastExplorationDate: null,
  },

  // Load exploration data from storage
  loadData: () => {
    try {
      console.log('[Store] Loading exploration data...');
      const data = loadExplorationData();
      const stats = getExplorationStats();

      set({
        exploredCells: data.exploredCells,
        positions: data.positions,
        bounds: data.bounds,
        lastSavedPosition: data.positions[data.positions.length - 1] || null,
        stats,
        isLoading: false,
        isTracking: isTrackingEnabled(),
      });

      console.log(`[Store] Loaded ${data.positions.length} positions, ${data.exploredCells.size} cells`);
    } catch (error) {
      console.error('[Store] Error loading data:', error);
      set({ isLoading: false });
    }
  },

  // Update current location (real-time, doesn't save yet)
  updateCurrentLocation: (location: LocationUpdate) => {
    set({ currentLocation: location });
  },

  // Add a new explored position
  addPosition: (location: LocationUpdate) => {
    const state = get();

    // Don't add if tracking is disabled
    if (!state.isTracking) {
      console.log('[Store] Tracking disabled, skipping position');
      return;
    }

    // Validate accuracy
    if (location.accuracy > MAX_GPS_ACCURACY) {
      console.log(`[Store] Position rejected: accuracy ${location.accuracy}m > ${MAX_GPS_ACCURACY}m`);
      return;
    }

    // Check if position is significantly different from last saved
    if (state.lastSavedPosition) {
      const isSignificant = isSignificantMovement(
        { latitude: state.lastSavedPosition.latitude, longitude: state.lastSavedPosition.longitude },
        { latitude: location.latitude, longitude: location.longitude },
        MIN_DISTANCE_BETWEEN_UPDATES
      );

      if (!isSignificant) {
        console.log('[Store] Position skipped: not significant movement');
        return;
      }
    }

    // Create explored area
    const exploredArea: ExploredArea = {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
      radius: 25, // EXPLORATION_RADIUS
      accuracy: location.accuracy,
    };

    // Save to storage (this also updates cells and bounds)
    saveExploredPosition(exploredArea);

    // Reload data from storage to get updated cells and bounds
    const data = loadExplorationData();
    const stats = getExplorationStats();

    set({
      exploredCells: data.exploredCells,
      positions: data.positions,
      bounds: data.bounds,
      lastSavedPosition: exploredArea,
      stats,
    });

    console.log(`[Store] Added position: ${exploredArea.latitude.toFixed(6)}, ${exploredArea.longitude.toFixed(6)}`);
  },

  // Clear all exploration data
  clearData: () => {
    try {
      clearExplorationData();
      set({
        exploredCells: new Set(),
        positions: [],
        bounds: null,
        lastSavedPosition: null,
        stats: {
          totalPositions: 0,
          totalCells: 0,
          exploredAreaSqMeters: 0,
          firstExplorationDate: null,
          lastExplorationDate: null,
        },
      });
      console.log('[Store] All data cleared');
    } catch (error) {
      console.error('[Store] Error clearing data:', error);
    }
  },

  // Refresh statistics
  refreshStats: () => {
    const stats = getExplorationStats();
    set({ stats });
  },

  // Enable/disable tracking
  setTracking: (enabled: boolean) => {
    setTrackingEnabled(enabled);
    set({ isTracking: enabled });
    console.log(`[Store] Tracking ${enabled ? 'enabled' : 'disabled'}`);
  },
}));
