import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';

export const MAP_VIEW_KEY = 'disaster-map-view';

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

export const TILE_LAYERS = {
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

export const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const userLocationIcon = L.divIcon({
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

export const selectedEventIcon = L.divIcon({
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

export function getInitialMapView(rememberMapView) {
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
export function getValidCoordinates(latitude, longitude) {
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
