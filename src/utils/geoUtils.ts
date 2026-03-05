import { getDistance, isPointWithinRadius } from 'geolib';
import { GRID_SIZE, EXPLORATION_RADIUS, EARTH_RADIUS_METERS } from './constants';
import type { ExploredArea, GridCell, ExplorationBounds } from '../types/location';

/**
 * Convert latitude/longitude to grid cell indices
 * Uses a simple grid system where each cell is GRID_SIZE x GRID_SIZE meters
 */
export function latLngToGridCell(lat: number, lng: number): GridCell {
  // Approximate: 1 degree latitude ≈ 111,111 meters
  // 1 degree longitude varies by latitude: ≈ 111,111 * cos(latitude) meters
  const metersPerDegreeLat = 111111;
  const metersPerDegreeLng = 111111 * Math.cos(lat * (Math.PI / 180));

  const latIndex = Math.floor((lat * metersPerDegreeLat) / GRID_SIZE);
  const lngIndex = Math.floor((lng * metersPerDegreeLng) / GRID_SIZE);

  return {
    latIndex,
    lngIndex,
    explored: false,
  };
}

/**
 * Convert grid cell back to approximate lat/lng (center of cell)
 */
export function gridCellToLatLng(latIndex: number, lngIndex: number): { lat: number; lng: number } {
  const metersPerDegreeLat = 111111;

  // For lng, we need to estimate latitude - use a reasonable default
  // This is approximate and mainly used for visualization
  const estimatedLat = (latIndex * GRID_SIZE) / metersPerDegreeLat;
  const metersPerDegreeLng = 111111 * Math.cos(estimatedLat * (Math.PI / 180));

  const lat = (latIndex * GRID_SIZE) / metersPerDegreeLat;
  const lng = (lngIndex * GRID_SIZE) / metersPerDegreeLng;

  return { lat, lng };
}

/**
 * Create a unique key for a grid cell
 */
export function gridCellKey(latIndex: number, lngIndex: number): string {
  return `${latIndex}_${lngIndex}`;
}

/**
 * Parse grid cell key back to indices
 */
export function parseGridCellKey(key: string): { latIndex: number; lngIndex: number } | null {
  const parts = key.split('_');
  if (parts.length !== 2) return null;

  const latIndex = parseInt(parts[0], 10);
  const lngIndex = parseInt(parts[1], 10);

  if (isNaN(latIndex) || isNaN(lngIndex)) return null;

  return { latIndex, lngIndex };
}

/**
 * Calculate all grid cells affected by an explored area (circle)
 * Returns the set of grid cells that overlap with the exploration radius
 */
export function calculateAffectedCells(area: ExploredArea): GridCell[] {
  const cells: GridCell[] = [];
  const centerCell = latLngToGridCell(area.latitude, area.longitude);

  // Calculate how many grid cells the radius covers
  const metersPerDegreeLat = 111111;
  const metersPerDegreeLng = 111111 * Math.cos(area.latitude * (Math.PI / 180));

  const cellsInRadius = Math.ceil(area.radius / GRID_SIZE) + 1;

  // Check all cells in a square around the center
  for (let latOffset = -cellsInRadius; latOffset <= cellsInRadius; latOffset++) {
    for (let lngOffset = -cellsInRadius; lngOffset <= cellsInRadius; lngOffset++) {
      const latIndex = centerCell.latIndex + latOffset;
      const lngIndex = centerCell.lngIndex + lngOffset;

      // Get the center point of this cell
      const cellCenter = gridCellToLatLng(latIndex, lngIndex);

      // Check if cell center is within the exploration radius
      const distance = getDistance(
        { latitude: area.latitude, longitude: area.longitude },
        { latitude: cellCenter.lat, longitude: cellCenter.lng }
      );

      if (distance <= area.radius + (GRID_SIZE * Math.SQRT2 / 2)) {
        // Add a small buffer (half diagonal of cell) to ensure coverage
        cells.push({
          latIndex,
          lngIndex,
          explored: true,
          firstVisited: area.timestamp,
        });
      }
    }
  }

  return cells;
}

/**
 * Calculate distance between two points using geolib
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );
}

/**
 * Check if a point is within exploration radius of any explored area
 */
export function isPointExplored(
  lat: number,
  lng: number,
  exploredAreas: ExploredArea[]
): boolean {
  return exploredAreas.some((area) =>
    isPointWithinRadius(
      { latitude: lat, longitude: lng },
      { latitude: area.latitude, longitude: area.longitude },
      area.radius
    )
  );
}

/**
 * Update exploration bounds to include a new position
 */
export function updateBounds(
  currentBounds: ExplorationBounds | null,
  lat: number,
  lng: number
): ExplorationBounds {
  if (!currentBounds) {
    return {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng,
    };
  }

  return {
    minLat: Math.min(currentBounds.minLat, lat),
    maxLat: Math.max(currentBounds.maxLat, lat),
    minLng: Math.min(currentBounds.minLng, lng),
    maxLng: Math.max(currentBounds.maxLng, lng),
  };
}

/**
 * Calculate the area explored in square meters
 * This is an approximation based on number of explored grid cells
 */
export function calculateExploredArea(exploredCells: Set<string>): number {
  return exploredCells.size * GRID_SIZE * GRID_SIZE;
}

/**
 * Calculate total distance traveled from position history
 */
export function calculateTotalDistance(positions: ExploredArea[]): number {
  if (positions.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    totalDistance += calculateDistance(
      positions[i - 1].latitude,
      positions[i - 1].longitude,
      positions[i].latitude,
      positions[i].longitude
    );
  }

  return totalDistance;
}

/**
 * Filter positions that are within the current map viewport
 * Used for viewport culling to improve rendering performance
 */
export function filterPositionsInViewport(
  positions: ExploredArea[],
  viewport: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  padding: number = 1.2 // Add padding to render slightly outside visible area
): ExploredArea[] {
  const minLat = viewport.latitude - (viewport.latitudeDelta * padding) / 2;
  const maxLat = viewport.latitude + (viewport.latitudeDelta * padding) / 2;
  const minLng = viewport.longitude - (viewport.longitudeDelta * padding) / 2;
  const maxLng = viewport.longitude + (viewport.longitudeDelta * padding) / 2;

  return positions.filter(
    (pos) =>
      pos.latitude >= minLat &&
      pos.latitude <= maxLat &&
      pos.longitude >= minLng &&
      pos.longitude <= maxLng
  );
}

/**
 * Check if two positions are significantly different (beyond accuracy threshold)
 */
export function isSignificantMovement(
  pos1: { latitude: number; longitude: number },
  pos2: { latitude: number; longitude: number },
  minDistance: number = 5 // meters
): boolean {
  const distance = calculateDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
  return distance >= minDistance;
}
