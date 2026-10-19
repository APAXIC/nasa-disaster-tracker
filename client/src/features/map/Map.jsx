import { memo, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MapClickHandler from './components/MapClickHandler.jsx';
import MapViewController from './components/MapViewController.jsx';
import EventMarkersLayer from './components/EventMarkersLayer.jsx';
import MapScaleControl from './components/MapScaleControl.jsx';
import {
  TILE_LAYERS,
  userLocationIcon,
  getInitialMapView,
  getValidCoordinates
} from './mapConfig.js';

function Map({
                              events = [],
                              userLocation,
                              watchZones = [],
                              searchRadius,
                              isSearchingNearby = false,
                              selectedEvent,
                              onSelectEvent,
                              mapSettings = {},
                              isPickingWatchZoneLocation = false,
                              onWatchZoneLocationSelect,
                              watchZonePreview
                            }) {
  const settings = {
    mapStyle: 'standard',
    theme: 'dark',
    showEvents: true,
    showWatchZones: true,
    showUserLocation: true,
    rememberMapView: true,
    ...mapSettings
  };

  const initialViewRef = useRef(
    getInitialMapView(settings.rememberMapView)
  );

  const markerRefs = useRef(new globalThis.Map());
  const clusterRef = useRef(null);

  // Avoid filtering the complete event collection on unrelated UI updates.
  const validEvents = useMemo(
    () =>
      events.filter((event) => {
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

        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );
      }),
    [events]
  );

  const mapStyle = TILE_LAYERS[settings.mapStyle]
    ? settings.mapStyle
    : 'standard';

  const layerConfig =
    mapStyle === 'standard'
      ? TILE_LAYERS.standard[settings.theme === 'light' ? 'light' : 'dark']
      : TILE_LAYERS[mapStyle];

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${
        settings.theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'
      }`}
    >
      <MapContainer
        center={initialViewRef.current.center}
        zoom={initialViewRef.current.zoom}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom
        worldCopyJump={false}
        className="z-0 h-full w-full"
        style={{
          cursor: isPickingWatchZoneLocation ? 'crosshair' : undefined
        }}
      >
        <MapClickHandler
          enabled={isPickingWatchZoneLocation}
          onLocationSelect={onWatchZoneLocationSelect}
        />
        <TileLayer
          key={`${mapStyle}-${settings.theme}`}
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          noWrap={false}
        />

        <MapScaleControl theme={settings.theme}/>

        {watchZonePreview && (() => {
          const center = getValidCoordinates(
            watchZonePreview.latitude,
            watchZonePreview.longitude
          );

          const radiusKm = Number(watchZonePreview.radiusKm);

          if (
            !center ||
            !Number.isFinite(radiusKm) ||
            radiusKm <= 0
          ) {
            return null;
          }

          return (
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: 0.18,
                weight: 3,
                dashArray: '8 6'
              }}
            >
              <Popup>
                <div className="text-sm text-gray-900">
                  <p className="font-semibold">Watch Zone Preview</p>
                  <p>{radiusKm} km radius</p>
                </div>
              </Popup>
            </Circle>
          );
        })()}

        <MapViewController
          rememberMapView={settings.rememberMapView}
        />

        {settings.showEvents && (
          <EventMarkersLayer
            events={validEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={onSelectEvent}
            markerRefs={markerRefs}
            clusterRef={clusterRef}
          />
        )}

        {settings.showWatchZones &&
          watchZones.map((zone) => {
            const center = getValidCoordinates(
              zone.latitude,
              zone.longitude
            );

            const radiusKm = Number(zone.radius_km ?? zone.radiusKm ?? zone.radius);
            const isMuted = zone.is_muted === true || zone.is_muted === 1;

            if (
              !center ||
              !Number.isFinite(radiusKm) ||
              radiusKm <= 0
            ) {
              return null;
            }

            const color = isMuted ? '#9ca3af' : '#2563eb';

            return (
              <Circle
                key={zone.id}
                center={center}
                radius={radiusKm * 1000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.16,
                  weight: 2,
                  dashArray: isMuted ? '6 6' : undefined
                }}
              >
                <Popup>
                  <div className="text-sm text-gray-900">
                    <p className="font-semibold">{zone.name}</p>
                    <p>{radiusKm} km radius</p>
                    <p>{isMuted ? 'Notifications are muted' : 'Notifications are enabled'}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })
        }

        {(() => {
          const position = getValidCoordinates(
            userLocation?.lat ?? userLocation?.latitude,
            userLocation?.lng ?? userLocation?.longitude
          );

          if (!position) {
            return null;
          }

          return (
            <>
              {settings.showUserLocation && (
                <Marker
                  position={position}
                  icon={userLocationIcon}
                  zIndexOffset={1000}
                >
                  <Popup>
            <span className="font-semibold text-gray-900">
              Your Location
            </span>
                  </Popup>
                </Marker>
              )}

              {isSearchingNearby &&
                Number.isFinite(Number(searchRadius)) &&
                Number(searchRadius) > 0 && (
                  <Circle
                    center={position}
                    radius={Number(searchRadius) * 1000}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.12,
                      weight: 2
                    }}
                  />
                )}
            </>
          );
        })()}
      </MapContainer>
    </div>
  );
}

export default memo(Map);
