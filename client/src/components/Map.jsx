import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

export default function Map({ events, userLocation, searchRadius, onSelectEvent }) {
  const defaultCenter = [20.0, 0.0];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={3}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Dark theme tile layer from Carto */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${MAP_KEY}`}
      />

      {/* Render user position and radius circle if location available */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={defaultIcon}>
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={searchRadius * 1000}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }}
          />
        </>
      )}

      {/* Render event markers and clusters */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onSelectEvent(event)
            }}
          >
            <Popup>
              <div style={{ maxWidth: '220px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 6px 0' }}>{event.title}</h3>
                {event.distance_km && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#2563eb' }}>
                    Distance: {Math.round(event.distance_km)} km away
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}