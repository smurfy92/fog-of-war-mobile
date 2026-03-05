export interface ExploredArea {
  latitude: number;
  longitude: number;
  timestamp: number;
  radius: number; // meters
  accuracy?: number;
}

export interface GridCell {
  latIndex: number;
  lngIndex: number;
  explored: boolean;
  firstVisited?: number;
}

export interface ExplorationData {
  version: number;
  gridSize: number; // meters
  exploredCells: Set<string>; // "lat_lng" keys
  positions: ExploredArea[];
  bounds: ExplorationBounds | null;
}

export interface ExplorationBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed?: number;
  heading?: number;
}
