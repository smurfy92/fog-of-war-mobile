import { ApiError } from '../types/api';
import { API_BASE_URL } from '../utils/constants';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export const apiService = {
  get: <T>(path: string, token: string) => request<T>('GET', path, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>('POST', path, token, body),
  delete: <T>(path: string, token: string) => request<T>('DELETE', path, token),
};
