import { apiService } from './apiService';
import { EXPLORATION_RADIUS } from '../utils/constants';
import type { ExploredArea } from '../types/location';
import type { ApiLocation } from '../types/api';

export async function pushPositions(positions: ExploredArea[], token: string): Promise<void> {
  if (positions.length === 0) return;

  const locations: ApiLocation[] = positions.map((position) => ({
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: position.accuracy,
    visitedAt: position.timestamp,
  }));

  await apiService.post('/locations/bulk', { locations }, token);
}

export async function pullPositions(token: string): Promise<ExploredArea[]> {
  const locations = await apiService.get<ApiLocation[]>('/locations', token);

  return locations.map((location) => ({
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: location.visitedAt,
    radius: EXPLORATION_RADIUS,
    accuracy: location.accuracy ?? 0,
  }));
}

export async function deleteRemotePositions(token: string): Promise<void> {
  await apiService.delete('/locations', token);
}
