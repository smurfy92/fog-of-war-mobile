import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Canvas, Circle, Group, Paint, BlendMode, Rect } from '@shopify/react-native-skia';
import type { Region } from 'react-native-maps';
import type MapView from 'react-native-maps';
import { useExplorationStore } from '../../stores/explorationStore';
import { filterPositionsInViewport } from '../../utils/geoUtils';
import { FOG_COLOR, VIEWPORT_PADDING } from '../../utils/constants';

interface FogOverlayProps {
  mapRegion: Region;
  mapRef: React.RefObject<MapView>;
}

interface ScreenCircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Convert lat/lng coordinates to screen pixel coordinates
 */
function latLngToScreen(
  latitude: number,
  longitude: number,
  mapRegion: Region,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  // Web Mercator projection (simplified)
  // This is an approximation for small areas

  const latDelta = mapRegion.latitudeDelta;
  const lngDelta = mapRegion.longitudeDelta;

  // Calculate relative position within the viewport
  const latOffset = latitude - mapRegion.latitude;
  const lngOffset = longitude - mapRegion.longitude;

  // Convert to screen coordinates
  const x = screenWidth / 2 + (lngOffset / lngDelta) * screenWidth;
  const y = screenHeight / 2 - (latOffset / latDelta) * screenHeight;

  return { x, y };
}

/**
 * Convert exploration radius (meters) to screen pixels
 */
function metersToScreenPixels(
  meters: number,
  latitude: number,
  mapRegion: Region,
  screenHeight: number
): number {
  // At the equator, 1 degree latitude ≈ 111,111 meters
  // Screen pixels per degree = screenHeight / latitudeDelta
  const metersPerDegree = 111111 * Math.cos(latitude * (Math.PI / 180));
  const pixelsPerDegree = screenHeight / mapRegion.latitudeDelta;
  const pixelsPerMeter = pixelsPerDegree / metersPerDegree;

  return meters * pixelsPerMeter;
}

export const FogOverlay: React.FC<FogOverlayProps> = ({ mapRegion, mapRef }) => {
  const positions = useExplorationStore((state) => state.positions);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Filter positions to only those visible in viewport (with padding for smooth scrolling)
  const visiblePositions = useMemo(() => {
    return filterPositionsInViewport(positions, mapRegion, VIEWPORT_PADDING);
  }, [positions, mapRegion]);

  // Convert explored positions to screen circles
  const screenCircles: ScreenCircle[] = useMemo(() => {
    return visiblePositions.map((pos) => {
      const screenPos = latLngToScreen(
        pos.latitude,
        pos.longitude,
        mapRegion,
        screenWidth,
        screenHeight
      );

      const screenRadius = metersToScreenPixels(
        pos.radius,
        pos.latitude,
        mapRegion,
        screenHeight
      );

      return {
        x: screenPos.x,
        y: screenPos.y,
        radius: screenRadius,
      };
    });
  }, [visiblePositions, mapRegion, screenWidth, screenHeight]);

  // If no explored areas, show full fog
  if (screenCircles.length === 0) {
    return (
      <Canvas style={styles.canvas} pointerEvents="none">
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          color={FOG_COLOR}
        />
      </Canvas>
    );
  }

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {/* Dark fog layer */}
      <Rect
        x={0}
        y={0}
        width={screenWidth}
        height={screenHeight}
        color={FOG_COLOR}
      />

      {/* Cut out explored circles using destination-out blend mode */}
      <Group blendMode={BlendMode.DstOut}>
        {screenCircles.map((circle, index) => (
          <Circle
            key={index}
            cx={circle.x}
            cy={circle.y}
            r={circle.radius}
            color="white"
          />
        ))}
      </Group>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    // Ensure canvas is above map but doesn't block touches
    pointerEvents: 'none',
  },
});
