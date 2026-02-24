import { useState, useEffect, useCallback, useMemo } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
    permissionState: PermissionState;
    recalibrate: () => void;
}

export function useGeolocation(): GeolocationState {
    const [state, setState] = useState<Omit<GeolocationState, 'recalibrate'>>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: true,
        permissionState: 'prompt',
    });

    // ─── Query permission state (browser Permissions API) ───
    useEffect(() => {
        if (!navigator.geolocation) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: set error for unsupported browsers
            setState(prev => ({
                ...prev,
                error: 'Location services are not supported by your browser.',
                loading: false,
                permissionState: 'unsupported',
            }));
            return;
        }

        // Safari doesn't support navigator.permissions for geolocation
        if (navigator.permissions?.query) {
            navigator.permissions
                .query({ name: 'geolocation' })
                .then(result => {
                    setState(prev => ({
                        ...prev,
                        permissionState: result.state as PermissionState,
                    }));
                    result.addEventListener('change', () => {
                        setState(prev => ({
                            ...prev,
                            permissionState: result.state as PermissionState,
                        }));
                    });
                })
                .catch(() => {
                    // Permissions API not available — fall through to watchPosition
                });
        }
    }, []);

    // ─── Watch position (continuous GPS tracking) ───
    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    error: null,
                    loading: false,
                    permissionState: 'granted',
                });
            },
            (error) => {
                const isDenied = error.code === error.PERMISSION_DENIED;
                setState(prev => ({
                    ...prev,
                    error: isDenied
                        ? 'Location access denied. Please enable location in your browser settings to play.'
                        : `Location error: ${error.message}`,
                    loading: false,
                    permissionState: isDenied ? 'denied' : prev.permissionState,
                }));
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 15000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const recalibrate = useCallback(() => {
        if (!navigator.geolocation) return;
        setState(prev => ({ ...prev, loading: true, error: null }));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setState({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    error: null,
                    loading: false,
                    permissionState: 'granted',
                });
            },
            (err) => {
                setState(prev => ({
                    ...prev,
                    error: `Location error: ${err.message}. Please check permissions.`,
                    loading: false,
                }));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }, []);

    return { ...state, recalibrate };
}

/** Calculate distance between two lat/lng coords in meters (Haversine) */
export function useDistanceTo(
    userLat: number | null,
    userLng: number | null,
    targetLat: number,
    targetLng: number
): number | null {
    return useMemo(() => {
        if (userLat === null || userLng === null) return null;
        const R = 6371000;
        const dLat = ((targetLat - userLat) * Math.PI) / 180;
        const dLng = ((targetLng - userLng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLat * Math.PI) / 180) *
            Math.cos((targetLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, [userLat, userLng, targetLat, targetLng]);
}
