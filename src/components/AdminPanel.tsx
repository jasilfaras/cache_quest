import { useState } from 'react';
import { DEFAULT_CENTER } from '../lib/constants';

interface AdminPanelProps {
    mockLocation: { latitude: number; longitude: number } | null;
    onSetMockLocation: (loc: { latitude: number; longitude: number } | null) => void;
    isMapClickMode: boolean;
    onToggleMapClickMode: () => void;
}

export default function AdminPanel({
    mockLocation,
    onSetMockLocation,
    isMapClickMode,
    onToggleMapClickMode,
}: AdminPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coordInput, setCoordInput] = useState('');

    const handleSetFromInputs = () => {
        const parts = coordInput.split(',').map(p => p.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                onSetMockLocation({ latitude: lat, longitude: lng });
                return;
            }
        }
        return;
    };

    const handleSetDefault = () => {
        onSetMockLocation({ latitude: DEFAULT_CENTER[1], longitude: DEFAULT_CENTER[0] });
        setCoordInput(`${DEFAULT_CENTER[1]}, ${DEFAULT_CENTER[0]}`);
    };

    const handleClear = () => {
        onSetMockLocation(null);
        setCoordInput('');
    };

    // Update inputs when mock location changes from map click
    const displayLat = mockLocation?.latitude.toFixed(6) ?? '';
    const displayLng = mockLocation?.longitude.toFixed(6) ?? '';

    return (
        <>
            {/* Toggle button */}
            <button
                className="admin-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Dev Admin Panel"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            {/* Panel */}
            <div className={`admin-panel ${isOpen ? 'open' : ''}`}>
                <div className="admin-panel-header">
                    <h3>🛠 Dev Admin</h3>
                    <button onClick={() => setIsOpen(false)} className="admin-panel-close">✕</button>
                </div>

                <div className="admin-section">
                    <label className="admin-label">Mock Location</label>

                    {/* Current status */}
                    {mockLocation && (
                        <div className="admin-current-loc">
                            <span className="admin-loc-dot" />
                            <span>{displayLat}, {displayLng}</span>
                        </div>
                    )}

                    {/* Preset buttons */}
                    <div className="admin-btn-row">
                        <button className="admin-btn" onClick={handleSetDefault}>
                            📍 Default Center
                        </button>
                        <button
                            className={`admin-btn ${isMapClickMode ? 'active' : ''}`}
                            onClick={onToggleMapClickMode}
                        >
                            {isMapClickMode ? '🎯 Click Map…' : '🗺 Pick on Map'}
                        </button>
                    </div>

                    {/* Manual input */}
                    <div className="admin-input-row" style={{ flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Lat, Lng (e.g. 10.269, 76.400)"
                            value={coordInput}
                            onChange={(e) => setCoordInput(e.target.value)}
                            className="admin-input"
                            style={{ minWidth: 0, width: '100%' }}
                        />
                        <button
                            className="admin-btn"
                            style={{ flex: 1, backgroundColor: 'rgba(0, 232, 123, 0.1)', color: '#00e87b', borderColor: '#00e87b', fontWeight: 'bold' }}
                            onClick={handleSetFromInputs}
                        >
                            Set Coordinate
                        </button>
                    </div>

                    {mockLocation && (
                        <button className="admin-btn danger" onClick={handleClear}>
                            ✕ Clear Mock Location
                        </button>
                    )}
                </div>

                <div className="admin-hint">
                    Mock location overrides real GPS.
                    Click "Pick on Map" then tap anywhere on the map.
                </div>
            </div>
        </>
    );
}
