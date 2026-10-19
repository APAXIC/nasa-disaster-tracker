import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapScaleControl({theme}) {
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
