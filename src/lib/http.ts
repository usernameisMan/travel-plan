import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "@/store/authStore";

// Support local development mode
const USE_LOCAL_API = process.env.NEXT_PUBLIC_USE_LOCAL_API === 'true';
const LOCAL_API_URL = 'http://localhost:3000';
const API_BASE_URL = USE_LOCAL_API 
  ? LOCAL_API_URL 
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://travel-plan-server-less-node.vercel.app');

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class HttpError extends Error {
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized errors (token expired)
      if (response.status === 401) {
        // Dispatch custom event to trigger logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        }
        throw new HttpError(401, 'Authentication token has expired. Please log in again.');
      }
      
      throw new HttpError(
        response.status,
        `HTTP error! status: ${response.status}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new HttpError(500, 'Invalid JSON response from server');
      }
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      console.warn('Received non-JSON response:', text);
      return text as unknown as T;
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new HttpError(0, 'Network error: Could not connect to server');
    }
    throw new HttpError(500, `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convenience methods for common HTTP verbs
export const http = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}; 