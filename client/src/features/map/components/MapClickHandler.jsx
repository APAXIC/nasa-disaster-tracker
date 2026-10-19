import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({
  enabled,
  onLocationSelect,
  onMapClick
}) {
  useMapEvents({
    click(event) {
      if (enabled) {
        onLocationSelect?.({
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      }

      const target = event.originalEvent?.target;
      if (
        target?.closest?.(
          '.leaflet-marker-icon, .leaflet-popup, .leaflet-control'
        )
      ) {
        return;
      }

      onMapClick?.(event);
    }
  });

  return null;
}
