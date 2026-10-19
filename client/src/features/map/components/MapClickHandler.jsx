import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({enabled, onLocationSelect}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      onLocationSelect?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
    }
  });

  return null;
}
