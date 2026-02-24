import { useState, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { CacheWithUser, Cache } from '../../lib/types';
import { createCache, updateCache, deleteCache } from '../../lib/cacheService';
import { useCaches } from '../../hooks/useCaches';
import { useLivePlayers } from '../../hooks/useLivePlayers';
import { Trash2, Plus, MapPin, Search, X, CheckCircle2, Edit3 } from 'lucide-react';
import MapView, { recenterMap } from '../MapView';

interface CachesViewProps {
    setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

export default function CachesView({ setToast }: CachesViewProps) {
    const { caches, loading } = useCaches<CacheWithUser>({
        withUsers: true,
        channelName: 'admin-caches-realtime',
    });

    const livePlayers = useLivePlayers();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Hidden' | 'Found'>('All');
    const [selectedCache, setSelectedCache] = useState<CacheWithUser | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [cacheToDelete, setCacheToDelete] = useState<string | null>(null);

    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapClickMode, setMapClickMode] = useState(false);

    const [formData, setFormData] = useState({ name: '', coordinates: '', hint: '', secret_code: '' });

    const handleDelete = async () => {
        if (!cacheToDelete) return;
        const { error } = await deleteCache(cacheToDelete);
        if (error) { setToast({ message: 'Error: ' + error.message, type: 'error' }); return; }
        if (selectedCache?.id === cacheToDelete) { setSelectedCache(null); setIsCreating(false); setEditMode(false); }
        setCacheToDelete(null);
        setToast({ message: 'Cache deleted.', type: 'success' });
    };

    const handleOpenCreate = () => {
        setSelectedCache(null);
        setEditMode(false);
        setFormData({ name: '', coordinates: '', hint: '', secret_code: '' });
        setMapClickMode(false);
        setIsCreating(true);
    };

    const handleEditSelected = () => {
        if (!selectedCache) return;
        setFormData({
            name: selectedCache.name,
            coordinates: `${selectedCache.lat}, ${selectedCache.lng}`,
            hint: selectedCache.hint || '',
            secret_code: selectedCache.secret_code,
        });
        setEditMode(true);
    };

    const handleCacheSelect = (cache: Cache) => {
        const full = caches.find(c => c.id === cache.id);
        if (full) {
            setSelectedCache(full);
            setIsCreating(false);
            setEditMode(false);
            setMapClickMode(false);
            recenterMap(mapRef.current, full.lat, full.lng);
        }
    };

    const handleMapClick = (lngLat: { lng: number; lat: number }) => {
        if (mapClickMode || isCreating || editMode) {
            setFormData(prev => ({ ...prev, coordinates: `${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}` }));
            setMapClickMode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let lat = 0, lng = 0;
        try {
            const parts = formData.coordinates.split(',').map(p => p.trim());
            if (parts.length !== 2) throw new Error();
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
            if (isNaN(lat) || isNaN(lng)) throw new Error();
        } catch {
            setToast({ message: 'Invalid coordinates. Format: Lat, Lng', type: 'error' });
            return;
        }

        const payload = { name: formData.name, lat, lng, hint: formData.hint || null, secret_code: formData.secret_code };

        if (isCreating) {
            const { error } = await createCache(payload);
            if (error) setToast({ message: 'Error: ' + error.message, type: 'error' });
            else {
                setToast({ message: 'Cache deployed!', type: 'success' });
                setIsCreating(false);
                setFormData({ name: '', coordinates: '', hint: '', secret_code: '' });
            }
        } else if (selectedCache && editMode) {
            const { error } = await updateCache(selectedCache.id, payload);
            if (error) setToast({ message: 'Error: ' + error.message, type: 'error' });
            else {
                setToast({ message: 'Cache updated.', type: 'success' });
                setEditMode(false);
                setSelectedCache(null);
            }
        }
    };

    const handleClosePanel = () => {
        setIsCreating(false);
        setEditMode(false);
        setSelectedCache(null);
        setMapClickMode(false);
        setFormData({ name: '', coordinates: '', hint: '', secret_code: '' });
    };

    const filteredCaches = useMemo(() => {
        let result = caches;
        if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.secret_code.toLowerCase().includes(search.toLowerCase()));
        if (filter === 'Hidden') result = result.filter(c => !c.is_found);
        if (filter === 'Found') result = result.filter(c => c.is_found);
        return result;
    }, [caches, search, filter]);

    const stats = useMemo(() => ({
        total: caches.length,
        hidden: caches.filter(c => !c.is_found).length,
        found: caches.filter(c => c.is_found).length,
    }), [caches]);

    const showForm = isCreating || editMode;

    return (
        <div className="admin-caches-layout">
            {/* ─── List Panel ─── */}
            <div className="admin-list-panel">
                <div className="admin-list-header">
                    <div className="admin-list-title-row">
                        <h2>Caches</h2>
                        <button onClick={handleOpenCreate} className="admin-btn primary small">
                            <Plus size={14} /> New
                        </button>
                    </div>

                    <div className="admin-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search caches..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="admin-filter-row">
                        {(['All', 'Hidden', 'Found'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
                            >
                                {f}
                                <span className="admin-filter-count">
                                    {f === 'All' ? stats.total : f === 'Hidden' ? stats.hidden : stats.found}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-list-scroll">
                    {loading ? (
                        <div className="admin-list-empty">Loading...</div>
                    ) : filteredCaches.length === 0 ? (
                        <div className="admin-list-empty">No caches found</div>
                    ) : (
                        filteredCaches.map(cache => (
                            <div
                                key={cache.id}
                                onClick={() => handleCacheSelect(cache)}
                                className={`admin-cache-card ${selectedCache?.id === cache.id ? 'selected' : ''}`}
                            >
                                <div className="admin-cache-card-top">
                                    <div className="admin-cache-card-info">
                                        <div className={`admin-cache-dot ${cache.is_found ? 'found' : 'active'}`} />
                                        <span className="admin-cache-name">{cache.name}</span>
                                    </div>
                                    <span className={`admin-cache-badge ${cache.is_found ? 'found' : 'active'}`}>
                                        {cache.is_found ? 'Found' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="admin-cache-meta">
                                    {cache.lat.toFixed(4)}, {cache.lng.toFixed(4)}
                                </div>
                                {cache.is_found && cache.users?.team_name && (
                                    <div className="admin-cache-claimed">
                                        <CheckCircle2 size={12} />
                                        <span>{cache.users.team_name}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ─── Map Panel ─── */}
            <div className="admin-map-panel">
                <MapView
                    caches={caches}
                    livePlayers={livePlayers}
                    userLocation={null}
                    onCacheSelect={handleCacheSelect}
                    onMapClick={handleMapClick}
                    pickMode={mapClickMode || isCreating || editMode}
                    mapRef={mapRef}
                />

                {(mapClickMode || isCreating || editMode) && (
                    <div className="admin-map-pick-banner">
                        <MapPin size={16} /> Tap map to set coordinates
                    </div>
                )}

                {/* ─── Floating Detail / Form Panel ─── */}
                {(selectedCache || showForm) && (
                    <div className="admin-detail-panel">
                        <div className="admin-detail-header">
                            <h3>{showForm ? (isCreating ? 'New Cache' : 'Edit Cache') : 'Cache Details'}</h3>
                            <div className="admin-detail-actions">
                                {selectedCache && !showForm && (
                                    <>
                                        <button onClick={handleEditSelected} className="admin-icon-btn" title="Edit">
                                            <Edit3 size={15} />
                                        </button>
                                        <button onClick={() => setCacheToDelete(selectedCache.id)} className="admin-icon-btn danger" title="Delete">
                                            <Trash2 size={15} />
                                        </button>
                                    </>
                                )}
                                <button onClick={handleClosePanel} className="admin-icon-btn">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="admin-detail-body">
                            {showForm ? (
                                <form onSubmit={handleSubmit} className="admin-form">
                                    <div className="admin-field">
                                        <label>Name</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="admin-input" placeholder="Library Cache" />
                                    </div>
                                    <div className="admin-field">
                                        <div className="admin-field-row">
                                            <label>Coordinates</label>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.geolocation.getCurrentPosition(
                                                            (pos) => {
                                                                const lat = pos.coords.latitude.toFixed(6);
                                                                const lng = pos.coords.longitude.toFixed(6);
                                                                setFormData(prev => ({ ...prev, coordinates: `${lat}, ${lng}` }));
                                                                recenterMap(mapRef.current, pos.coords.latitude, pos.coords.longitude);
                                                            },
                                                            () => setToast({ message: 'Location unavailable', type: 'error' }),
                                                            { enableHighAccuracy: true }
                                                        );
                                                    }}
                                                    className="admin-btn tiny secondary"
                                                >
                                                    My Location
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMapClickMode(!mapClickMode)}
                                                    className={`admin-btn tiny ${mapClickMode ? 'danger' : 'secondary'}`}
                                                >
                                                    {mapClickMode ? 'Cancel' : 'Pick Map'}
                                                </button>
                                            </div>
                                        </div>
                                        <input required value={formData.coordinates} onChange={e => setFormData({ ...formData, coordinates: e.target.value })} className="admin-input mono" placeholder="10.2694, 76.4003" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Secret Code</label>
                                        <input required value={formData.secret_code} onChange={e => setFormData({ ...formData, secret_code: e.target.value.toUpperCase() })} className="admin-input mono" placeholder="QUEST-42" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Hint <span className="optional">(optional)</span></label>
                                        <textarea value={formData.hint} onChange={e => setFormData({ ...formData, hint: e.target.value })} className="admin-input" rows={3} placeholder="Look under the bench near..." />
                                    </div>
                                    <button type="submit" className="admin-btn primary full">
                                        {isCreating ? 'Deploy Cache' : 'Save Changes'}
                                    </button>
                                </form>
                            ) : selectedCache && (
                                <div className="admin-detail-info">
                                    <div className="admin-detail-row">
                                        <span className="admin-detail-label">Name</span>
                                        <span className="admin-detail-value">{selectedCache.name}</span>
                                    </div>
                                    <div className="admin-detail-row">
                                        <span className="admin-detail-label">Status</span>
                                        <span className={`admin-cache-badge inline ${selectedCache.is_found ? 'found' : 'active'}`}>
                                            {selectedCache.is_found ? 'Found' : 'Hidden'}
                                        </span>
                                    </div>
                                    <div className="admin-detail-row">
                                        <span className="admin-detail-label">Secret Code</span>
                                        <span className="admin-detail-value mono accent">{selectedCache.secret_code}</span>
                                    </div>
                                    <div className="admin-detail-row">
                                        <span className="admin-detail-label">Coordinates</span>
                                        <span className="admin-detail-value mono">{selectedCache.lat.toFixed(5)}, {selectedCache.lng.toFixed(5)}</span>
                                    </div>
                                    {selectedCache.hint && (
                                        <div className="admin-detail-row vertical">
                                            <span className="admin-detail-label">Hint</span>
                                            <p className="admin-detail-hint">"{selectedCache.hint}"</p>
                                        </div>
                                    )}
                                    {selectedCache.is_found && selectedCache.users?.team_name && (
                                        <div className="admin-detail-claimed">
                                            <CheckCircle2 size={16} />
                                            <div>
                                                <div className="admin-detail-claimed-label">Recovered by</div>
                                                <div className="admin-detail-claimed-team">{selectedCache.users.team_name}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {cacheToDelete && (
                <div className="admin-modal-overlay" onClick={() => setCacheToDelete(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-icon danger">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="admin-modal-title">Delete this cache?</h3>
                        <p className="admin-modal-desc">This action cannot be undone.</p>
                        <div className="admin-modal-actions">
                            <button onClick={() => setCacheToDelete(null)} className="admin-btn secondary">Cancel</button>
                            <button onClick={handleDelete} className="admin-btn danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
