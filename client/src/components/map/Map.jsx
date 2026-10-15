import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.22);
      border: 2px solid rgba(96, 165, 250, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px rgba(59, 130, 246, 0.65);
    ">
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid white;
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const selectedEventIcon = L.divIcon({
  className: 'selected-event-marker',
  html: `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #f97316;
      border: 3px solid white;
      box-shadow:
        0 0 0 6px rgba(249, 115, 22, 0.28),
        0 0 18px rgba(249, 115, 22, 0.9);
    "></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function SelectedEventController({
                                   selectedEvent,
                                   markerRefs,
                                   clusterRef
                                 }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedEvent) return;

    const marker = markerRefs.current.get(String(selectedEvent.id));

    if (!marker) return;

    const revealSelectedMarker = () => {
      const position = marker.getLatLng();
      const targetZoom = Math.max(map.getZoom(), 7);

      map.setView(position, targetZoom, {
        animate: true
      });

      marker.openPopup();
    };

    const clusterGroup = clusterRef.current;

    if (clusterGroup?.zoomToShowLayer) {
      clusterGroup.zoomToShowLayer(marker, revealSelectedMarker);
    } else {
      revealSelectedMarker();
    }
  }, [selectedEvent, map, markerRefs, clusterRef]);

  return null;
}

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

export default function Map({
                              events,
                              userLocation,
                              searchRadius,
                              selectedEvent,
                              onSelectEvent
                            }) {
  const defaultCenter = [20, 0];

  const markerRefs = useRef(new globalThis.Map());
  const clusterRef = useRef(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <MapContainer
        center={defaultCenter}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        worldCopyJump={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${MAP_KEY}`}
          noWrap={false}
        />

        <SelectedEventController
          selectedEvent={selectedEvent}
          markerRefs={markerRefs}
          clusterRef={clusterRef}
        />

        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <span className="font-semibold text-gray-900">
                  Your Location
                </span>
              </Popup>
            </Marker>

            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={searchRadius * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15
              }}
            />
          </>
        )}

        <MarkerClusterGroup
          ref={clusterRef}
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {events.map((event) => {
            const isSelected =
              String(selectedEvent?.id) === String(event.id);

            return (
              <Marker
                key={event.id}
                ref={(marker) => {
                  const id = String(event.id);

                  if (marker) {
                    markerRefs.current.set(id, marker);
                  } else {
                    markerRefs.current.delete(id);
                  }
                }}
                position={[event.latitude, event.longitude]}
                icon={isSelected ? selectedEventIcon : defaultIcon}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{
                  click: () => onSelectEvent(event)
                }}
              >
                <Popup>
                  <div className="max-w-xs p-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {event.title}
                    </h3>

                    {event.distance_km != null && (
                      <p className="text-xs font-medium text-blue-600 mt-1">
                        {Math.round(event.distance_km)} km away
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}