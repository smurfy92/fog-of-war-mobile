import { apiService } from './apiService';
import { saveAuthToken, saveAuthUser, clearAuthData, getAuthToken, getAuthUser } from './storageService';
import type { ApiUser, AuthResponse } from '../types/api';

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const response = await apiService.post<AuthResponse>('/auth/register', { email, password });
  saveAuthToken(response.access_token);
  saveAuthUser(response.user);
  return response;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await apiService.post<AuthResponse>('/auth/login', { email, password });
  saveAuthToken(response.access_token);
  saveAuthUser(response.user);
  return response;
}

export function logoutUser(): void {
  clearAuthData();
}

export function getPersistedToken(): string | null {
  return getAuthToken();
}

export function getPersistedUser(): ApiUser | null {
  return getAuthUser();
}
