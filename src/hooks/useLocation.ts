import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore } from '../stores/locationStore';
import type { StoredLocation } from '../models/types';

/**
 * Race a promise against a timeout. Rejects if the timeout fires first.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Location request timed out')),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Get location permission, handling the case where requestForegroundPermissionsAsync
 * hangs on Android (e.g. permission was permanently denied).
 */
async function getPermission(): Promise<'granted' | 'denied'> {
  // First check existing status — this never hangs
  const current = await Location.getForegroundPermissionsAsync();
  console.log(
    '[Location] Current permission:',
    current.status,
    'canAskAgain:',
    current.canAskAgain,
  );

  if (current.status === 'granted') return 'granted';

  // If we can't ask again (user selected "Don't ask again"), don't call request — it hangs
  if (!current.canAskAgain) {
    console.warn(
      '[Location] Permission permanently denied — opening app settings',
    );
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
    return 'denied';
  }

  // Safe to request — add timeout as safety net
  try {
    const { status } = await withTimeout(
      Location.requestForegroundPermissionsAsync(),
      15_000,
    );
    console.log('[Location] Request result:', status);
    return status === 'granted' ? 'granted' : 'denied';
  } catch (e) {
    console.warn('[Location] Permission request timed out or failed:', e);
    return 'denied';
  }
}

export function useLocation() {
  const { location, isLoading, error, setLocation, setLoading, setError } =
    useLocationStore();

  const fetchLocation = useCallback(async () => {
    console.log('[Location] fetchLocation started');
    setLoading(true);
    try {
      const permStatus = await getPermission();
      if (permStatus !== 'granted') {
        setError(
          'Location permission denied. Please grant it in app settings.',
        );
        return;
      }

      // Check if location services are enabled on the device
      const enabled = await Location.hasServicesEnabledAsync();
      console.log('[Location] Services enabled:', enabled);
      if (!enabled) {
        console.warn('[Location] Location services are disabled on device');
        setError(
          'Location services are disabled. Please enable GPS in device settings.',
        );
        return;
      }

      let position: Location.LocationObject | null = null;

      // Strategy 1: Try last known position first (instant, no GPS needed)
      try {
        position = await Location.getLastKnownPositionAsync();
        console.log(
          '[Location] Strategy 1 (lastKnown):',
          position
            ? `${position.coords.latitude}, ${position.coords.longitude}`
            : 'null',
        );
      } catch (e) {
        console.warn('[Location] Strategy 1 (lastKnown) failed:', e);
      }

      // Strategy 2: Request current position with timeout
      if (!position) {
        try {
          console.log(
            '[Location] Strategy 2 (Balanced, 10s timeout) starting...',
          );
          position = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            10_000,
          );
          console.log(
            '[Location] Strategy 2 success:',
            `${position.coords.latitude}, ${position.coords.longitude}`,
          );
        } catch (e) {
          console.warn(
            '[Location] Strategy 2 (Balanced) failed:',
            e instanceof Error ? e.message : e,
          );
        }
      }

      // Strategy 3: Lowest accuracy as last resort
      if (!position) {
        try {
          console.log(
            '[Location] Strategy 3 (Lowest, 10s timeout) starting...',
          );
          position = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            }),
            10_000,
          );
          console.log(
            '[Location] Strategy 3 success:',
            `${position.coords.latitude}, ${position.coords.longitude}`,
          );
        } catch (e) {
          console.warn(
            '[Location] Strategy 3 (Lowest) failed:',
            e instanceof Error ? e.message : e,
          );
        }
      }

      if (!position) {
        console.error(
          '[Location] All strategies failed — no position obtained',
        );
        setError(
          'Could not determine location. Please enable GPS and try again outdoors.',
        );
        return;
      }

      const stored: StoredLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        source: 'gps',
      };

      console.log(
        '[Location] Success! Stored:',
        `${stored.latitude}, ${stored.longitude}`,
      );
      setLocation(stored);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get location';
      console.error('[Location] Unexpected error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      console.log('[Location] fetchLocation finished');
    }
  }, [setLocation, setLoading, setError]);

  return { location, isLoading, error, fetchLocation };
}
