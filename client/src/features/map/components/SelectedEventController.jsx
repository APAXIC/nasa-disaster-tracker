import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function SelectedEventController({
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
