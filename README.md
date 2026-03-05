# Fog of War Map Explorer

A React Native app that displays a greyed-out map that progressively reveals as you explore, with background location tracking that works even when the app is closed.

## Features

- **Fog of War Effect**: Map starts completely grey and reveals as you move
- **Background Tracking**: Continues tracking your location even when the app is closed
- **Persistent Data**: All explored areas are saved and persist across app restarts
- **Real-time Updates**: Map reveals in real-time as you explore
- **Exploration Stats**: Track your explored area, distance traveled, and more
- **OpenStreetMap**: Uses free OpenStreetMap tiles (no API key required)

## Tech Stack

- **Expo** (Custom Dev Client for native modules)
- **React Native Maps** with OpenStreetMap tiles
- **@shopify/react-native-skia** for high-performance fog rendering
- **react-native-mmkv** for fast persistent storage
- **expo-location** + **expo-task-manager** for background location tracking
- **zustand** for state management
- **geolib** for geospatial calculations

## Prerequisites

- Node.js 18+ and npm/yarn
- iOS development: macOS with Xcode installed
- Android development: Android Studio with SDK installed
- Physical device for testing (background location doesn't work in simulators)

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS (macOS only):
```bash
cd ios
pod install
cd ..
```

3. Create a custom development build (required for native modules):

For iOS:
```bash
npx expo run:ios
```

For Android:
```bash
npx expo run:android
```

## Running the App

### Development Mode

**Important**: Background location tracking requires a physical device. Simulators/emulators won't work for full functionality.

#### iOS (Physical Device):
```bash
npx expo run:ios --device
```

#### Android (Physical Device):
```bash
npx expo run:android --device
```

### Building for Production

#### iOS:
```bash
eas build --platform ios
```

#### Android:
```bash
eas build --platform android
```

## How It Works

### Architecture

1. **Location Tracking**:
   - Background task runs continuously using `expo-location` and `expo-task-manager`
   - Updates every 5 meters of movement
   - Filters out inaccurate GPS readings (>20m accuracy)

2. **Data Storage**:
   - Explored positions stored as lat/lng coordinates with 25m radius
   - Grid-based system (10m x 10m cells) for efficient storage
   - MMKV provides fast, persistent storage
   - Data persists across app restarts

3. **Fog of War Rendering**:
   - Skia Canvas renders dark overlay over entire map
   - Explored areas cut out using blend modes
   - Viewport culling for performance (only renders visible circles)
   - GPU-accelerated rendering

4. **State Management**:
   - Zustand store manages exploration state
   - Real-time updates to UI as location changes
   - Background task saves directly to MMKV

### Data Structure

```typescript
// Each explored position
{
  latitude: number,
  longitude: number,
  timestamp: number,
  radius: 25, // meters
  accuracy: number
}

// Grid cells for efficient storage
{
  exploredCells: Set<string>, // "latIndex_lngIndex"
  positions: ExploredArea[],
  bounds: { minLat, maxLat, minLng, maxLng }
}
```

## Configuration

Key constants can be modified in `src/utils/constants.ts`:

- `EXPLORATION_RADIUS`: Radius around user that gets revealed (default: 25m)
- `GRID_SIZE`: Size of each grid cell (default: 10m)
- `MIN_DISTANCE_BETWEEN_UPDATES`: Minimum movement before recording (default: 5m)
- `MAX_GPS_ACCURACY`: Reject readings worse than this (default: 20m)

## Permissions

The app requires the following permissions:

### iOS:
- Location When In Use
- Location Always (for background tracking)

### Android:
- ACCESS_FINE_LOCATION
- ACCESS_BACKGROUND_LOCATION
- FOREGROUND_SERVICE_LOCATION

Permissions are requested on first launch via the `PermissionGuard` component.

## Testing

### Manual Testing Checklist:

1. **Permissions**:
   - [ ] App requests foreground location permission
   - [ ] App requests background location permission
   - [ ] Permission denial handled gracefully

2. **Foreground Tracking**:
   - [ ] Current location marker appears on map
   - [ ] Map reveals as you move (25m radius)
   - [ ] Stats update in real-time
   - [ ] Fog renders smoothly

3. **Background Tracking**:
   - [ ] Close app and walk around
   - [ ] Reopen app and verify new areas revealed
   - [ ] Check that exploration continued while app was closed

4. **Data Persistence**:
   - [ ] Kill and restart app
   - [ ] Verify all explored areas still visible
   - [ ] Stats persist correctly

5. **Edge Cases**:
   - [ ] App handles GPS signal loss
   - [ ] App handles low accuracy readings
   - [ ] Clear Data button works correctly
   - [ ] Pause/Resume tracking works

### Battery Testing:
- Test for extended periods (2-4 hours) to measure battery impact
- Expected: <10% battery drain per hour with active tracking

## Troubleshooting

### iOS: Background location stops after 3 minutes
- Ensure "Always Allow" is selected for location permission
- Check that `UIBackgroundModes` includes "location" in app.json
- Verify `showsBackgroundLocationIndicator` is true (shows blue bar)

### Android: Foreground service notification doesn't appear
- Check that `FOREGROUND_SERVICE_LOCATION` permission is granted
- Verify `foregroundService` config in locationService.ts
- Test on Android 14+ devices

### Map doesn't show tiles
- Check internet connection (OpenStreetMap requires network)
- Verify OPENSTREETMAP_TILE_URL is correct
- Try zooming in/out to trigger tile reload

### Fog doesn't render
- Check that Skia is properly installed (`@shopify/react-native-skia`)
- Verify babel.config.js includes reanimated plugin
- Try restarting Metro bundler

### Location accuracy is poor
- Test outdoors (GPS works poorly indoors)
- Wait a few minutes for GPS to acquire signal
- Check device location settings
- Verify HIGH_ACCURACY mode is enabled

## Project Structure

```
fog-of-war-explorer/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapView.tsx          # Main map with OpenStreetMap
│   │   │   └── FogOverlay.tsx       # Skia fog rendering
│   │   └── UI/
│   │       ├── PermissionGuard.tsx  # Permission flow
│   │       └── ExplorationStats.tsx # Stats display
│   ├── services/
│   │   ├── locationService.ts       # Background location tracking
│   │   └── storageService.ts        # MMKV persistence
│   ├── stores/
│   │   └── explorationStore.ts      # Zustand state management
│   ├── utils/
│   │   ├── constants.ts             # Configuration
│   │   └── geoUtils.ts              # Geographic calculations
│   └── types/
│       └── location.ts              # TypeScript types
├── App.tsx                          # Main app component
├── app.json                         # Expo configuration
└── package.json
```

## Future Enhancements

Potential features to add:

- [ ] Export exploration data as GPX/GeoJSON
- [ ] Heatmap visualization mode
- [ ] Exploration achievements/gamification
- [ ] Social features (share explored areas)
- [ ] Offline map caching
- [ ] Custom map styles
- [ ] Exploration challenges
- [ ] Multi-user exploration comparison

## Performance Optimization

Current optimizations:

- **Viewport culling**: Only renders circles visible on screen
- **Distance-based updates**: Updates only when moved 5+ meters
- **Accuracy filtering**: Rejects low-quality GPS readings
- **Grid-based storage**: Efficient storage using 10m cells
- **GPU acceleration**: Skia uses GPU for rendering
- **Batch updates**: Background task batches location updates

## Known Limitations

- Background tracking on iOS may be terminated after extended periods
- GPS accuracy varies significantly between devices
- Indoor exploration will have poor accuracy
- Battery drain increases with continuous background tracking
- Large explored datasets (100+ hours) may impact performance

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
