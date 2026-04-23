/**
 * API Client for Xiaozhi R1 Hub
 * Automatically detects the base URL depending on the environment.
 * In development, we use relative paths (if proxied by Vite) or fallback to localhost.
 * In production (running on the Android APK), the origin will be the NanoHTTPD server.
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const API_BASE = getBaseUrl();

export interface ApiOptions extends RequestInit {
  data?: any;
}

export async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  
  if (options.data) {
    options.body = JSON.stringify(options.data);
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return data as T;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}
