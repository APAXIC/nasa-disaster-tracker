import React from 'react';

export default function Sidebar({
                                  events,
                                  selectedEvent,
                                  onSelectEvent,
                                  onLocateUser,
                                  onResetSearch,
                                  isSearchingNearby,
                                  searchRadius,
                                  setSearchRadius
                                }) {
  return (
    <div className="sidebar">
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>
          NASA EONET Monitor
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
          Real-time global natural hazard tracker
        </p>
      </div>

      {/* Geolocation Controls */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1f2937' }}>
        <button
          onClick={onLocateUser}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Find Disasters Near Me
        </button>

        {isSearchingNearby && (
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Search Radius: {searchRadius} km
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px' }}
            />
            <button
              onClick={onResetSearch}
              style={{
                marginTop: '8px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Reset to all global events
            </button>
          </div>
        )}
      </div>

      {/* Disaster List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px' }}>
          Showing {events.length} active events
        </p>

        {events.map((evt) => {
          const isSelected = selectedEvent?.id === evt.id;
          return (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#1f2937' : '#111827',
                border: isSelected ? '1px solid #f97316' : '1px solid #374151',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <h4 style={{ fontSize: '0.9rem', color: '#f3f4f6' }}>{evt.title}</h4>
              {evt.distance_km && (
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'block', marginTop: '4px' }}>
                  {Math.round(evt.distance_km)} km away
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}