import { memo, useEffect, useMemo, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { defaultIcon, selectedEventIcon } from '../mapConfig.js';
import SelectedEventController from './SelectedEventController.jsx';

function EventMarkersLayer({
  events,
  selectedEvent,
  onSelectEvent,
  markerRefs,
  clusterRef
}) {
  const map = useMap();
  const [viewportVersion, setViewportVersion] = useState(0);

  useEffect(() => {
    const updateViewport = () => {
      setViewportVersion((version) => version + 1);
    };

    map.on('moveend zoomend resize', updateViewport);

    return () => {
      map.off('moveend zoomend resize', updateViewport);
    };
  }, [map]);

  const visibleEvents = useMemo(() => {
    const bounds = map.getBounds().pad(0.15);
    const selectedId = selectedEvent?.id == null
      ? null
      : String(selectedEvent.id);

    return events.filter((event) => {
      if (
        event.latitude === null ||
        event.latitude === undefined ||
        event.latitude === '' ||
        event.longitude === null ||
        event.longitude === undefined ||
        event.longitude === ''
      ) {
        return false;
      }

      const latitude = Number(event.latitude);
      const longitude = Number(event.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return false;
      }

      if (selectedId !== null && String(event.id) === selectedId) {
        return true;
      }

      return bounds.contains([latitude, longitude]);
    });
  }, [events, selectedEvent?.id, viewportVersion, map]);

  return (
    <>
      <SelectedEventController
        selectedEvent={selectedEvent}
        markerRefs={markerRefs}
        clusterRef={clusterRef}
      />

      <MarkerClusterGroup
        ref={clusterRef}
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {visibleEvents.map((event) => {
          const isSelected = String(selectedEvent?.id) === String(event.id);

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
              position={[Number(event.latitude), Number(event.longitude)]}
              icon={isSelected ? selectedEventIcon : defaultIcon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onSelectEvent?.(event)
              }}
            >
              <Popup>
                <div className="max-w-xs p-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {event.title}
                  </h3>

                  {event.distance_km != null && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                      {Math.round(event.distance_km)} km away
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </>
  );
}

export default memo(EventMarkersLayer);
