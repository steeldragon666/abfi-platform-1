/**
 * Custom hook to load Google Maps via the Forge proxy or direct API.
 * Prefers Forge proxy when VITE_FRONTEND_FORGE_API_KEY is set,
 * otherwise falls back to direct Google Maps API key.
 */
import { useEffect, useState, useRef } from "react";

// Forge proxy configuration
const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Direct Google Maps API key (fallback)
const DIRECT_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Determine which approach to use
const USE_PROXY = !!FORGE_API_KEY;
const API_KEY = USE_PROXY ? FORGE_API_KEY : DIRECT_API_KEY;

// Track global loading state to avoid duplicate script loads
let isLoading = false;
let isLoaded = false;
let loadError: Error | null = null;
const callbacks: Array<(loaded: boolean, error: Error | null) => void> = [];

function notifyCallbacks(loaded: boolean, error: Error | null) {
  callbacks.forEach((cb) => cb(loaded, error));
  callbacks.length = 0;
}

function loadMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isLoaded && window.google?.maps) {
      resolve();
      return;
    }

    // Currently loading - wait for completion
    if (isLoading) {
      callbacks.push((loaded, error) => {
        if (loaded) resolve();
        else reject(error);
      });
      return;
    }

    if (!API_KEY) {
      const error = new Error("No Google Maps API key configured. Set VITE_FRONTEND_FORGE_API_KEY or VITE_GOOGLE_MAPS_API_KEY.");
      loadError = error;
      reject(error);
      return;
    }

    isLoading = true;

    const script = document.createElement("script");

    if (USE_PROXY) {
      script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry,visualization`;
      script.crossOrigin = "anonymous";
    } else {
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry,visualization`;
    }
    script.async = true;

    script.onload = () => {
      isLoading = false;
      isLoaded = true;
      loadError = null;
      notifyCallbacks(true, null);
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      isLoaded = false;
      loadError = new Error(`Failed to load Google Maps script${USE_PROXY ? " via proxy" : ""}`);
      notifyCallbacks(false, loadError);
      reject(loadError);
    };

    document.head.appendChild(script);
  });
}

interface UseProxyMapLoaderResult {
  isLoaded: boolean;
  loadError: Error | null;
}

/**
 * Hook that loads Google Maps via the Forge proxy.
 * Use this instead of useJsApiLoader from @react-google-maps/api.
 */
export function useProxyMapLoader(): UseProxyMapLoaderResult {
  const [state, setState] = useState<UseProxyMapLoaderResult>({
    isLoaded: isLoaded && !!window.google?.maps,
    loadError,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Already loaded
    if (isLoaded && window.google?.maps) {
      setState({ isLoaded: true, loadError: null });
      return;
    }

    loadMapScript()
      .then(() => {
        if (mountedRef.current) {
          setState({ isLoaded: true, loadError: null });
        }
      })
      .catch((error) => {
        if (mountedRef.current) {
          setState({ isLoaded: false, loadError: error });
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
