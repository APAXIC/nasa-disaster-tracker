import { useEffect, useState } from 'react';
import { DEFAULT_MAP_SETTINGS, MAP_SETTINGS_KEY, loadSavedMapSettings } from './mapSettings.js';

export default function useMapSettings() {
  const [mapSettings, setMapSettings] = useState(loadSavedMapSettings);

  useEffect(() => {
    try {
      localStorage.setItem(
        MAP_SETTINGS_KEY,
        JSON.stringify(mapSettings)
      );
    } catch (error) {
      console.error('[Map Settings Save Error]:', error);
    }
  }, [mapSettings]);

  useEffect(() => {
    document.documentElement.dataset.theme = mapSettings.theme;
  }, [mapSettings.theme]);

  const handleResetMapSettings = () => {
    setMapSettings({ ...DEFAULT_MAP_SETTINGS });
  };

  return { mapSettings, setMapSettings, handleResetMapSettings };
}
