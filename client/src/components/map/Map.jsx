import { useEffect, useRef } from 'react';
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

const MAP_VIEW_KEY = 'disaster-map-view';

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

const TILE_LAYERS = {
  standard: {
    dark: {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${MAP_KEY}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    light: {
      url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${MAP_KEY}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri'
  },
  topographic: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
};

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
display: flex;
align-items: center;
justify-content: center;
">
<div style="
width: 14px;
height: 14px;
border-radius: 50%;
background: #3b82f6;
border: 2px solid white;
box-shadow: 0 0 14px rgba(59, 130, 246, 0.65);
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

function getInitialMapView(rememberMapView) {
  if (!rememberMapView) {
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    };
  }

  try {
    const saved = localStorage.getItem(MAP_VIEW_KEY);

    if (!saved) {
      return {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      };
    }

    const parsed = JSON.parse(saved);

    const isValidCenter =
      Array.isArray(parsed.center) &&
      parsed.center.length === 2 &&
      parsed.center.every(
        (value) => typeof value === 'number' && Number.isFinite(value)
      );

    const isValidZoom =
      typeof parsed.zoom === 'number' &&
      Number.isFinite(parsed.zoom) &&
      parsed.zoom >= 2 &&
      parsed.zoom <= 18;

    if (!isValidCenter || !isValidZoom) {
      return {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      };
    }

    return {
      center: parsed.center,
      zoom: parsed.zoom
    };
  } catch {
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    };
  }
}

function MapViewController({ rememberMapView }) {
  const map = useMap();

  useEffect(() => {
    if (!rememberMapView) {
      try {
        localStorage.removeItem(MAP_VIEW_KEY);
      } catch (error) {
        console.error('[Map View Storage Error]:', error);
      }

      return undefined;
    }

    const saveMapView = () => {
      const center = map.getCenter();

      try {
        localStorage.setItem(
          MAP_VIEW_KEY,
          JSON.stringify({
            center: [center.lat, center.lng],
            zoom: map.getZoom()
          })
        );
      } catch (error) {
        console.error('[Map View Storage Error]:', error);
      }
    };

    map.on('moveend', saveMapView);
    map.on('zoomend', saveMapView);
    saveMapView();

    return () => {
      map.off('moveend', saveMapView);
      map.off('zoomend', saveMapView);
    };
  }, [map, rememberMapView]);

  return null;
}

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

function getValidCoordinates(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === '' ||
    longitude === ''
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

function MapScaleControl({ theme }) {
  const map = useMap();

  useEffect(() => {
    const isDark = theme === 'dark';

    const control = L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: true,
      maxWidth: 140,
      updateWhenIdle: true
    });

    control.addTo(map);

    const updateScaleTheme = () => {
      const lines = control.getContainer()?.querySelectorAll('.leaflet-control-scale-line');

      lines?.forEach((line) => {
        line.style.backgroundColor = isDark
          ? 'rgba(17, 24, 39, 0.94)'
          : 'rgba(255, 255, 255, 0.95)';

        line.style.color = isDark ? '#f9fafb' : '#111827';
        line.style.borderColor = isDark ? '#f9fafb' : '#111827';
        line.style.borderTop = 'none';
        line.style.textShadow = 'none';
        line.style.fontWeight = '600';
        line.style.fontSize = '11px';
        line.style.padding = '3px 5px 2px';
        line.style.boxSizing = 'border-box';
        line.style.boxShadow = isDark
          ? '0 1px 4px rgba(0, 0, 0, 0.45)'
          : '0 1px 4px rgba(0, 0, 0, 0.15)';
      });
    };

    updateScaleTheme();

    return () => {
      control.remove();
    };
  }, [map, theme]);

  return null;
}

export default function Map({
  events = [],
  userLocation,
  watchZones = [],
  searchRadius,
  isSearchingNearby = false,
  selectedEvent,
  onSelectEvent,
  mapSettings = {},
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
      >
        <TileLayer
          key={`${mapStyle}-${settings.theme}`}
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          noWrap={false}
        />

        <MapScaleControl theme={settings.theme} />

        <MapViewController
          rememberMapView={settings.rememberMapView}
        />

        {settings.showEvents && (
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
              {events
                .filter(
                  (event) =>
                    Number.isFinite(Number(event.latitude)) &&
                    Number.isFinite(Number(event.longitude))
                )
                .map((event) => {
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
                      position={[
                        Number(event.latitude),
                        Number(event.longitude)
                      ]}
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