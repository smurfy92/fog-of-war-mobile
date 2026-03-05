// Exploration Configuration
export const EXPLORATION_RADIUS = 25; // meters - radius around user that gets revealed
export const GRID_SIZE = 10; // meters - size of each grid cell for efficient storage
export const MAX_POSITION_HISTORY = 10000; // Maximum number of positions to keep in memory
export const MIN_DISTANCE_BETWEEN_UPDATES = 5; // meters - minimum distance before recording new position
export const MAX_GPS_ACCURACY = 20; // meters - reject GPS readings with accuracy worse than this

// Location Service Configuration
export const LOCATION_TASK_NAME = 'background-location-task';
export const LOCATION_UPDATE_DISTANCE = 5; // meters - update every 5 meters of movement
export const LOCATION_DEFERRED_UPDATES_INTERVAL = 1000; // milliseconds - batch updates

// Storage Keys
export const STORAGE_KEYS = {
  EXPLORED_CELLS: 'explored_cells',
  POSITION_HISTORY: 'position_history',
  EXPLORATION_BOUNDS: 'exploration_bounds',
  LAST_POSITION: 'last_position',
  STATS: 'exploration_stats',
  TRACKING_ENABLED: 'tracking_enabled',
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
} as const;

// API Configuration
// For iOS simulator use localhost. For Android emulator use 10.0.2.2.
// For a physical device, replace with your machine's local IP address.
export const API_BASE_URL = 'http://localhost:3000/api';

// Map Configuration
export const DEFAULT_MAP_REGION = {
  latitudeDelta: 0.01, // Roughly 1km
  longitudeDelta: 0.01,
};

export const OPENSTREETMAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAX_ZOOM_LEVEL = 19;

// Fog of War Rendering
export const FOG_COLOR = 'rgba(0, 0, 0, 0.85)'; // Dark overlay color
export const FOG_BLUR_RADIUS = 10; // Optional blur effect at edges
export const VIEWPORT_PADDING = 1.2; // Render circles slightly outside viewport (multiplier)

// Statistics
export const EARTH_RADIUS_METERS = 6371000; // Earth's radius in meters for distance calculations
