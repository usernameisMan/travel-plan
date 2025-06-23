import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://travel-plan-server-less-node.vercel.app';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function httpRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  });

  if (requiresAuth) {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new HttpError(401, 'No authentication token available');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Convenience methods for common HTTP verbs
export const http = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}; 