import { createMMKV } from 'react-native-mmkv';
import { STORAGE_KEYS, MAX_POSITION_HISTORY } from '../utils/constants';
import {
  calculateAffectedCells,
  gridCellKey,
  updateBounds,
} from '../utils/geoUtils';
import type {
  ExploredArea,
  ExplorationData,
  ExplorationBounds,
  LocationUpdate,
} from '../types/location';

// Initialize MMKV storage
const storage = createMMKV({
  id: 'fog-of-war-storage',
});

/**
 * Save a new explored position and update grid cells
 */
export function saveExploredPosition(position: ExploredArea): void {
  try {
    // 1. Add to position history
    const history = getPositionHistory();
    history.push(position);

    // Keep only the most recent positions to manage memory
    if (history.length > MAX_POSITION_HISTORY) {
      history.shift();
    }

    storage.set(STORAGE_KEYS.POSITION_HISTORY, JSON.stringify(history));

    // 2. Update grid cells
    const affectedCells = calculateAffectedCells(position);
    const exploredCells = getExploredCells();

    affectedCells.forEach((cell) => {
      exploredCells.add(gridCellKey(cell.latIndex, cell.lngIndex));
    });

    storage.set(STORAGE_KEYS.EXPLORED_CELLS, JSON.stringify([...exploredCells]));

    // 3. Update exploration bounds
    const currentBounds = getExplorationBounds();
    const newBounds = updateBounds(currentBounds, position.latitude, position.longitude);
    storage.set(STORAGE_KEYS.EXPLORATION_BOUNDS, JSON.stringify(newBounds));

    // 4. Update last known position
    storage.set(STORAGE_KEYS.LAST_POSITION, JSON.stringify(position));

    console.log(`[Storage] Saved position: ${position.latitude}, ${position.longitude}`);
  } catch (error) {
    console.error('[Storage] Error saving explored position:', error);
  }
}

/**
 * Get position history
 */
export function getPositionHistory(): ExploredArea[] {
  try {
    const historyJson = storage.getString(STORAGE_KEYS.POSITION_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('[Storage] Error loading position history:', error);
    return [];
  }
}

/**
 * Get explored cells as a Set
 */
export function getExploredCells(): Set<string> {
  try {
    const cellsJson = storage.getString(STORAGE_KEYS.EXPLORED_CELLS);
    return new Set(cellsJson ? JSON.parse(cellsJson) : []);
  } catch (error) {
    console.error('[Storage] Error loading explored cells:', error);
    return new Set();
  }
}

/**
 * Get exploration bounds
 */
export function getExplorationBounds(): ExplorationBounds | null {
  try {
    const boundsJson = storage.getString(STORAGE_KEYS.EXPLORATION_BOUNDS);
    return boundsJson ? JSON.parse(boundsJson) : null;
  } catch (error) {
    console.error('[Storage] Error loading exploration bounds:', error);
    return null;
  }
}

/**
 * Get last known position
 */
export function getLastPosition(): ExploredArea | null {
  try {
    const positionJson = storage.getString(STORAGE_KEYS.LAST_POSITION);
    return positionJson ? JSON.parse(positionJson) : null;
  } catch (error) {
    console.error('[Storage] Error loading last position:', error);
    return null;
  }
}

/**
 * Load all exploration data
 */
export function loadExplorationData(): ExplorationData {
  return {
    version: 1,
    gridSize: 10,
    exploredCells: getExploredCells(),
    positions: getPositionHistory(),
    bounds: getExplorationBounds(),
  };
}

/**
 * Get/Set tracking enabled state
 */
export function isTrackingEnabled(): boolean {
  try {
    const enabled = storage.getBoolean(STORAGE_KEYS.TRACKING_ENABLED);
    return enabled !== undefined ? enabled : true; // Default to true
  } catch (error) {
    console.error('[Storage] Error checking tracking state:', error);
    return true;
  }
}

export function setTrackingEnabled(enabled: boolean): void {
  try {
    storage.set(STORAGE_KEYS.TRACKING_ENABLED, enabled);
    console.log(`[Storage] Tracking ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('[Storage] Error setting tracking state:', error);
  }
}

/**
 * Get exploration statistics
 */
export interface ExplorationStats {
  totalPositions: number;
  totalCells: number;
  exploredAreaSqMeters: number;
  firstExplorationDate: number | null;
  lastExplorationDate: number | null;
}

export function getExplorationStats(): ExplorationStats {
  try {
    const positions = getPositionHistory();
    const cells = getExploredCells();
    const gridSize = 10; // meters

    return {
      totalPositions: positions.length,
      totalCells: cells.size,
      exploredAreaSqMeters: cells.size * gridSize * gridSize,
      firstExplorationDate: positions.length > 0 ? positions[0].timestamp : null,
      lastExplorationDate: positions.length > 0 ? positions[positions.length - 1].timestamp : null,
    };
  } catch (error) {
    console.error('[Storage] Error calculating stats:', error);
    return {
      totalPositions: 0,
      totalCells: 0,
      exploredAreaSqMeters: 0,
      firstExplorationDate: null,
      lastExplorationDate: null,
    };
  }
}

/**
 * Clear all exploration data
 */
export function clearExplorationData(): void {
  try {
    storage.remove(STORAGE_KEYS.EXPLORED_CELLS);
    storage.remove(STORAGE_KEYS.POSITION_HISTORY);
    storage.remove(STORAGE_KEYS.EXPLORATION_BOUNDS);
    storage.remove(STORAGE_KEYS.LAST_POSITION);
    console.log('[Storage] All exploration data cleared');
  } catch (error) {
    console.error('[Storage] Error clearing data:', error);
  }
}

/**
 * Auth token persistence
 */
export function saveAuthToken(token: string): void {
  storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function getAuthToken(): string | null {
  return storage.getString(STORAGE_KEYS.AUTH_TOKEN) ?? null;
}

export function saveAuthUser(user: { id: string; email: string }): void {
  storage.set(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
}

export function getAuthUser(): { id: string; email: string } | null {
  try {
    const json = storage.getString(STORAGE_KEYS.AUTH_USER);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function clearAuthData(): void {
  storage.remove(STORAGE_KEYS.AUTH_TOKEN);
  storage.remove(STORAGE_KEYS.AUTH_USER);
}

/**
 * Export exploration data as JSON (for backup/sharing)
 */
export function exportExplorationData(): string {
  const data = loadExplorationData();
  return JSON.stringify({
    ...data,
    exploredCells: [...data.exploredCells], // Convert Set to Array for JSON
    exportedAt: Date.now(),
  });
}

/**
 * Import exploration data from JSON
 */
export function importExplorationData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.exploredCells) {
      storage.set(STORAGE_KEYS.EXPLORED_CELLS, JSON.stringify(data.exploredCells));
    }
    if (data.positions) {
      storage.set(STORAGE_KEYS.POSITION_HISTORY, JSON.stringify(data.positions));
    }
    if (data.bounds) {
      storage.set(STORAGE_KEYS.EXPLORATION_BOUNDS, JSON.stringify(data.bounds));
    }

    console.log('[Storage] Data imported successfully');
    return true;
  } catch (error) {
    console.error('[Storage] Error importing data:', error);
    return false;
  }
}
