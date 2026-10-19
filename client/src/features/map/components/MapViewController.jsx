import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_VIEW_KEY } from '../mapConfig.js';

export default function MapViewController({rememberMapView}) {
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
