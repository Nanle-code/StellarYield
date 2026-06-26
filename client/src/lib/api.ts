const LOCAL_API_BASE_URL = "http://localhost:3001";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isLocalhostEnvironment(): boolean {
  return typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : true;
}

/**
 * Check if API is properly configured for the current environment.
 * Returns true if:
 * - VITE_API_BASE_URL or VITE_API_URL is configured, OR
 * - Running on localhost (where default backend is expected at :3001)
 */
export function isApiConfigured(env: ImportMetaEnv = import.meta.env): boolean {
  const configured = env.VITE_API_BASE_URL || env.VITE_API_URL;
  if (configured?.trim()) {
    return true;
  }
  return isLocalhostEnvironment();
}

/**
 * Get the API base URL for the current environment.
 * 
 * Priority:
 * 1. VITE_API_BASE_URL (if set)
 * 2. VITE_API_URL (if set)
 * 3. http://localhost:3001 (if on localhost)
 * 
 * On non-localhost environments without configured URLs, throws an error.
 * Call isApiConfigured() first to check if API is available.
 */
export function getApiBaseUrl(env: ImportMetaEnv = import.meta.env): string {
  const configured = env.VITE_API_BASE_URL || env.VITE_API_URL;
  if (configured?.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (!isLocalhostEnvironment()) {
    throw new Error("API_UNAVAILABLE: Backend URL not configured for preview environment. Please set VITE_API_BASE_URL.");
  }

  return LOCAL_API_BASE_URL;
}

/**
 * Safely get API base URL or null if not configured.
 * Use this when you want to handle missing API gracefully.
 */
export function getApiBaseUrlOrNull(env: ImportMetaEnv = import.meta.env): string | null {
  try {
    return getApiBaseUrl(env);
  } catch {
    return null;
  }
}

export function apiUrl(path: string, env?: ImportMetaEnv): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl(env)}${normalizedPath}`;
}
