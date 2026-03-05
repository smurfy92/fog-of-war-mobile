import { create } from 'zustand';
import {
  registerUser,
  loginUser,
  logoutUser,
  getPersistedToken,
  getPersistedUser,
} from '../services/authService';
import type { ApiUser } from '../types/api';

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  loadPersistedAuth: () => void;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  loadPersistedAuth: () => {
    const token = getPersistedToken();
    const user = getPersistedUser();
    if (token && user) {
      set({ token, user });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await registerUser(email, password);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginUser(email, password);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: () => {
    logoutUser();
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
