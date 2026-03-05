// DEBUG STUB - react-native-maps import temporarily removed to isolate crash
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ExplorationMapViewProps {
  onRegionChange?: (region: any) => void;
}

export const ExplorationMapView: React.FC<ExplorationMapViewProps> = () => {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text>MAP PLACEHOLDER - testing without react-native-maps</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { flex: 1, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
});
