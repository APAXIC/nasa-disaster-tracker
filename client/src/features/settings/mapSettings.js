export const MAP_SETTINGS_KEY = 'disaster-map-settings';

export const DEFAULT_MAP_SETTINGS = {
  mapStyle: 'standard',
  theme: 'dark',
  showEvents: true,
  showWatchZones: true,
  showUserLocation: true,
  rememberMapView: true
};

export const loadSavedMapSettings = () => {
  try {
    const saved = localStorage.getItem(MAP_SETTINGS_KEY);

    if (!saved) return DEFAULT_MAP_SETTINGS;

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_MAP_SETTINGS,
      ...parsed,
      mapStyle: ['standard', 'satellite', 'topographic'].includes(parsed.mapStyle)
        ? parsed.mapStyle
        : DEFAULT_MAP_SETTINGS.mapStyle,
      theme: ['light', 'dark'].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_MAP_SETTINGS.theme
    };
  } catch {
    return DEFAULT_MAP_SETTINGS;
  }
};

