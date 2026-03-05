export interface ApiUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: ApiUser;
}

export interface ApiLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  visitedAt: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
