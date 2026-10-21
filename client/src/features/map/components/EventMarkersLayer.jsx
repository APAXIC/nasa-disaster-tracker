import L from 'leaflet';
import { memo, useEffect, useMemo, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { getEventMarkerIcon } from '../mapConfig.js';
import SelectedEventController from './SelectedEventController.jsx';
import {
  formatEventDate,
  getDistance,
  getEventCategories,
  getEventDate,
  getMagnitudeInfo
} from '../../events/eventUtils.js';

function EventMarkersLayer({
  events,
  selectedEvent,
  onSelectEvent,
  markerRefs,
  clusterRef,
  userLocation
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
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          const tier = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
          return L.divIcon({
            html: `<span>${count}</span>`,
            className: `disaster-cluster disaster-cluster-${tier}`,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });
        }}
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
              icon={getEventMarkerIcon(event, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onSelectEvent?.(event)
              }}
            >
              <Popup>
                <EventPopupDetails event={event} userLocation={userLocation} />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </>
  );
}

function EventPopupDetails({ event, userLocation }) {
  const categories = getEventCategories(event)
    .map((category) => category.title)
    .join(', ');
  const magnitude = getMagnitudeInfo(event);
  const distance = getDistance(event, userLocation);

  return (
    <div className="max-w-xs space-y-1 p-1 text-gray-900">
      <h3 className="text-sm font-bold">{event.title}</h3>

      {categories && (
        <p className="text-xs text-gray-600">{categories}</p>
      )}

      <p className="text-xs text-gray-600">
        Date: {formatEventDate(getEventDate(event))}
      </p>

      <p className="text-xs font-medium text-orange-700">
        {magnitude
          ? `Magnitude: ${magnitude.value}${magnitude.unit ? ` ${magnitude.unit}` : ''}`
          : 'Magnitude: unavailable'}
      </p>

      {distance !== null ? (
        <p className="text-xs font-medium text-blue-700">
          {distance < 10
            ? `${distance.toFixed(1)} km from you`
            : `${Math.round(distance)} km from you`}
        </p>
      ) : (
        <p className="text-xs text-gray-500">Distance unavailable</p>
      )}
    </div>
  );
}

export default memo(EventMarkersLayer);
