import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { Cache, LivePlayer } from '../lib/types';
import { DEFAULT_CENTER } from '../lib/constants';

// ─── Campus Bounds (±0.005° ≈ 550m around center) ───
const BOUNDS_OFFSET = 0.005;
const CAMPUS_BOUNDS: maplibregl.LngLatBoundsLike = [
    [DEFAULT_CENTER[0] - BOUNDS_OFFSET, DEFAULT_CENTER[1] - BOUNDS_OFFSET],
    [DEFAULT_CENTER[0] + BOUNDS_OFFSET, DEFAULT_CENTER[1] + BOUNDS_OFFSET],
];

// ─── Tile URLs ───
const TILES = {
    osm: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
};

type MapLayerType = 'Dark' | 'Street' | 'Satellite';

interface MapViewProps {
    caches: Cache[];
    livePlayers?: LivePlayer[];
    userLocation: { latitude: number; longitude: number } | null;
    onCacheSelect: (cache: Cache) => void;
    onMapClick?: (lngLat: { lng: number; lat: number }) => void;
    pickMode?: boolean;
    mapRef: React.MutableRefObject<maplibregl.Map | null>;
}

/** Wait for map to be style-loaded, then run callback */
function whenLoaded(map: maplibregl.Map, fn: () => void) {
    if (map.isStyleLoaded()) fn();
    else map.once('load', fn);
}

export default function MapView({
    caches,
    livePlayers,
    userLocation,
    onCacheSelect,
    onMapClick,
    pickMode = false,
    mapRef,
}: MapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);
    const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
    const cacheMarkersRef = useRef<{ [id: string]: { marker: maplibregl.Marker; isFound: boolean } }>({});
    const playerMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
    const initialCenterDone = useRef(false);

    const onCacheSelectRef = useRef(onCacheSelect);
    const onMapClickRef = useRef(onMapClick);
    const pickModeRef = useRef(pickMode);
    useEffect(() => { onCacheSelectRef.current = onCacheSelect; }, [onCacheSelect]);
    useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
    useEffect(() => { pickModeRef.current = pickMode; }, [pickMode]);

    const [layerType, setLayerType] = useState<MapLayerType>('Dark');

    // ─── Initialize map ───
    useEffect(() => {
        if (!mapContainerRef.current || !containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: TILES.osm,
                        tileSize: 256,
                    },
                    'satellite-tiles': {
                        type: 'raster',
                        tiles: TILES.satellite,
                        tileSize: 256,
                        maxzoom: 18,
                    },
                },
                layers: [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm-tiles',
                        layout: { visibility: 'visible' },
                    },
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite-tiles',
                        layout: { visibility: 'none' },
                    },
                ],
            },
            center: DEFAULT_CENTER,
            zoom: 17,
            pitch: 0,
            attributionControl: false,
            maxZoom: 19,
            minZoom: 15,
            maxBounds: CAMPUS_BOUNDS,
        });

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();

        // Handle clicks — preview marker is placed DIRECTLY here
        // so MapLibre's projection is guaranteed to be in-sync
        map.on('click', (e) => {
            const lngLat = e.lngLat;

            // Notify parent (for coordinate field update)
            onMapClickRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });

            // Only show preview marker when in pick mode (creating/editing a cache)
            if (pickModeRef.current) {
                if (!previewMarkerRef.current) {
                    const el = document.createElement('div');
                    el.className = 'preview-marker';
                    previewMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
                        .setLngLat(lngLat)
                        .addTo(map);
                } else {
                    previewMarkerRef.current.setLngLat(lngLat);
                }
            }
        });

        // Force recalculate after flex layout has settled
        map.on('load', () => {
            map.resize();
            containerRef.current?.classList.add('map-dark-mode');
        });

        // ResizeObserver for flex layout changes (panels opening/closing)
        const ro = new ResizeObserver(() => {
            map.resize();
        });
        ro.observe(mapContainerRef.current);

        mapRef.current = map;

        return () => {
            ro.disconnect();
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Layer Switching ───
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            if (map.getLayer('osm-layer')) {
                map.setLayoutProperty('osm-layer', 'visibility',
                    layerType === 'Dark' || layerType === 'Street' ? 'visible' : 'none');
            }
            if (map.getLayer('satellite-layer')) {
                map.setLayoutProperty('satellite-layer', 'visibility',
                    layerType === 'Satellite' ? 'visible' : 'none');
            }

            const container = containerRef.current;
            if (container) {
                container.classList.toggle('map-dark-mode', layerType === 'Dark');
            }
        };

        whenLoaded(map, apply);
    }, [layerType, mapRef]);

    // ─── Cache markers — GATED ON MAP LOAD ───
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const updateMarkers = () => {
            const currentIds = new Set(caches.map(c => c.id));

            for (const id of Object.keys(cacheMarkersRef.current)) {
                if (!currentIds.has(id)) {
                    cacheMarkersRef.current[id].marker.remove();
                    delete cacheMarkersRef.current[id];
                }
            }

            caches.forEach(cache => {
                const existing = cacheMarkersRef.current[cache.id];
                const isFound = !!cache.is_found;

                if (existing && existing.isFound === isFound) {
                    existing.marker.setLngLat([cache.lng, cache.lat]);
                    return;
                }

                if (existing) existing.marker.remove();

                const el = document.createElement('div');
                el.className = isFound ? 'cache-marker-found' : 'cache-marker-active';

                if (!isFound) {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (pickModeRef.current) {
                            onMapClickRef.current?.({ lng: cache.lng, lat: cache.lat });
                        } else {
                            onCacheSelectRef.current(cache);
                        }
                    });
                }

                const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([cache.lng, cache.lat])
                    .addTo(map);

                cacheMarkersRef.current[cache.id] = { marker, isFound };
            });
        };

        whenLoaded(map, updateMarkers);
    }, [caches, mapRef]);

    // ─── Player markers — GATED ON MAP LOAD ───
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !livePlayers) return;

        const updatePlayers = () => {
            const currentIds = new Set(livePlayers.map(p => p.userId));

            for (const id of Object.keys(playerMarkersRef.current)) {
                if (!currentIds.has(id)) {
                    playerMarkersRef.current[id].remove();
                    delete playerMarkersRef.current[id];
                }
            }

            livePlayers.forEach(player => {
                const existing = playerMarkersRef.current[player.userId];
                if (existing) {
                    existing.setLngLat([player.longitude, player.latitude]);
                    return;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'player-marker';

                const dot = document.createElement('div');
                dot.className = 'player-marker-dot';

                const label = document.createElement('div');
                label.className = 'player-marker-label';
                label.innerText = player.teamName;

                wrapper.appendChild(dot);
                wrapper.appendChild(label);

                const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
                    .setLngLat([player.longitude, player.latitude])
                    .addTo(map);

                playerMarkersRef.current[player.userId] = marker;
            });
        };

        whenLoaded(map, updatePlayers);
    }, [livePlayers, mapRef]);

    // ─── User location marker — GATED ON MAP LOAD ───
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !userLocation) return;

        const updateUser = () => {
            if (!userMarkerRef.current) {
                const el = document.createElement('div');
                el.className = 'user-dot';

                userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([userLocation.longitude, userLocation.latitude])
                    .addTo(map);

                if (!initialCenterDone.current) {
                    map.flyTo({
                        center: [userLocation.longitude, userLocation.latitude],
                        zoom: 17,
                        duration: 1200,
                    });
                    initialCenterDone.current = true;
                }
            } else {
                userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
            }
        };

        whenLoaded(map, updateUser);
    }, [userLocation, mapRef]);

    // ─── Clear preview marker when pickMode is turned off ───
    useEffect(() => {
        if (!pickMode && previewMarkerRef.current) {
            previewMarkerRef.current.remove();
            previewMarkerRef.current = null;
        }
    }, [pickMode]);

    const handleLayerChange = useCallback((layer: MapLayerType) => {
        setLayerType(layer);
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: '#050505' }}>
            <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

            {/* Layer toggle */}
            <div className="map-layer-toggle">
                {(['Dark', 'Street', 'Satellite'] as MapLayerType[]).map(layer => (
                    <button
                        key={layer}
                        onClick={() => handleLayerChange(layer)}
                        className={`map-layer-btn ${layerType === layer ? 'active' : ''}`}
                    >
                        {layer}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Re-center map on user location */
// eslint-disable-next-line react-refresh/only-export-components
export function recenterMap(
    map: maplibregl.Map | null,
    userLat: number | null,
    userLng: number | null
) {
    if (!map || userLat === null || userLng === null) return;
    map.flyTo({
        center: [userLng, userLat],
        zoom: 17,
        duration: 800,
    });
}
