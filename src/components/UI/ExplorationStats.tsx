import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useExplorationStore } from '../../stores/explorationStore';

interface ExplorationStatsProps {
  onClearData?: () => void;
}

export const ExplorationStats: React.FC<ExplorationStatsProps> = ({ onClearData }) => {
  const stats = useExplorationStore((state) => state.stats);
  const isTracking = useExplorationStore((state) => state.isTracking);
  const setTracking = useExplorationStore((state) => state.setTracking);

  const formatArea = (sqMeters: number): string => {
    if (sqMeters < 1000) {
      return `${sqMeters.toFixed(0)} m²`;
    } else if (sqMeters < 1000000) {
      return `${(sqMeters / 1000).toFixed(2)} km²`;
    } else {
      return `${(sqMeters / 1000000).toFixed(2)} km²`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalCells}</Text>
          <Text style={styles.statLabel}>Grid Cells</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatArea(stats.exploredAreaSqMeters)}</Text>
          <Text style={styles.statLabel}>Area Explored</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPositions}</Text>
          <Text style={styles.statLabel}>Positions</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={() => setTracking(!isTracking)}
        >
          <Text style={[styles.trackingButtonText, isTracking && styles.trackingButtonTextActive]}>
            {isTracking ? '⏸️ Pause Tracking' : '▶️ Resume Tracking'}
          </Text>
        </TouchableOpacity>

        {onClearData && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearData}>
            <Text style={styles.clearButtonText}>Clear Data</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  trackingButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonActive: {
    backgroundColor: '#4CAF50',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  trackingButtonTextActive: {
    color: 'white',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
});
