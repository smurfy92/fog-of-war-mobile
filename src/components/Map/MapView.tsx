import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { UrlTile, PROVIDER_DEFAULT, Region, Marker } from 'react-native-maps';
import { useExplorationStore } from '../../stores/explorationStore';
import { OPENSTREETMAP_TILE_URL, MAX_ZOOM_LEVEL, DEFAULT_MAP_REGION } from '../../utils/constants';
import { FogOverlay } from './FogOverlay';

interface ExplorationMapViewProps {
  onRegionChange?: (region: Region) => void;
}

export const ExplorationMapView: React.FC<ExplorationMapViewProps> = ({ onRegionChange }) => {
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const currentLocation = useExplorationStore((state) => state.currentLocation);
  const lastSavedPosition = useExplorationStore((state) => state.lastSavedPosition);

  // Initialize map region based on last known position or current location
  useEffect(() => {
    if (!mapRegion && (currentLocation || lastSavedPosition)) {
      const position = currentLocation || lastSavedPosition;
      if (position) {
        const initialRegion: Region = {
          latitude: position.latitude,
          longitude: position.longitude,
          ...DEFAULT_MAP_REGION,
        };
        setMapRegion(initialRegion);

        // Animate to initial position once map is ready
        if (mapReady && mapRef.current) {
          mapRef.current.animateToRegion(initialRegion, 500);
        }
      }
    }
  }, [currentLocation, lastSavedPosition, mapRegion, mapReady]);

  // Follow user location when it updates
  useEffect(() => {
    if (currentLocation && mapReady && mapRef.current) {
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...DEFAULT_MAP_REGION,
      };

      if (mapRegion) {
        const distance = Math.sqrt(
          Math.pow(mapRegion.latitude - currentLocation.latitude, 2) +
          Math.pow(mapRegion.longitude - currentLocation.longitude, 2)
        );

        if (distance > 0.0005) {
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    }
  }, [currentLocation, mapReady]);

  const handleRegionChange = (region: Region) => {
    setMapRegion(region);
    onRegionChange?.(region);
  };

  const handleMapReady = () => {
    setMapReady(true);
    console.log('[Map] Map ready');
  };

  const defaultRegion: Region = {
    latitude: 37.78825,
    longitude: -122.4324,
    ...DEFAULT_MAP_REGION,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={mapRegion || defaultRegion}
        onRegionChangeComplete={handleRegionChange}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
        minZoomLevel={3}
        maxZoomLevel={MAX_ZOOM_LEVEL}
      >
        <UrlTile
          urlTemplate={OPENSTREETMAP_TILE_URL}
          maximumZ={MAX_ZOOM_LEVEL}
          flipY={false}
          shouldReplaceMapContent={true}
        />

        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
            description={`Accuracy: ${currentLocation.accuracy?.toFixed(1)}m`}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {mapReady && mapRegion && <FogOverlay mapRegion={mapRegion} mapRef={mapRef} />}

      {!mapReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
  },
});
