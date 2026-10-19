import SettingToggle from './SettingToggle.jsx';
import {
  MapIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon,
  EyeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const selectClass =
  'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white';


export default function SettingsPanel({
                                        settings,
                                        onChange,
                                        onReset,
                                        isAuthenticated = false
                                      }) {
  const updateSetting = (key, value) => {
    onChange((current) => ({
      ...current,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <MapIcon className="h-4 w-4 text-blue-400" />
          Map appearance
        </h3>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Map style</span>
          <select
            value={settings.mapStyle}
            onChange={(event) =>
              updateSetting('mapStyle', event.target.value)
            }
            className={selectClass}
          >
            <option value="standard">Standard</option>
            <option value="satellite">Satellite</option>
            <option value="topographic">Topographic</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Application theme</span>
          <select
            value={settings.theme}
            onChange={(event) =>
              updateSetting('theme', event.target.value)
            }
            className={selectClass}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <EyeIcon className="h-4 w-4 text-blue-400" />
          Map layers
        </h3>

        <SettingToggle
          label="Disaster events"
          description="Show event markers on the map."
          checked={settings.showEvents}
          onChange={(value) => updateSetting('showEvents', value)}
        />

        <SettingToggle
          label="Your location"
          description="Show your location and the selected search radius when location data is available."
          checked={settings.showUserLocation}
          onChange={(value) => updateSetting('showUserLocation', value)}
        />

        <SettingToggle
          label="Watch zones"
          description={
            isAuthenticated
              ? 'Show your saved monitoring zones.'
              : 'Sign in to view your personal watch zones.'
          }
          checked={isAuthenticated && settings.showWatchZones}
          disabled={!isAuthenticated}
          onChange={(value) => updateSetting('showWatchZones', value)}
        />

        {!isAuthenticated && (
          <p className="text-xs leading-5 text-gray-500">
            Watch zones are available only to signed-in users.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <MapPinIcon className="h-4 w-4 text-blue-400" />
          Map behavior
        </h3>

        <SettingToggle
          label="Remember map view"
          description="Save the map center and zoom between visits."
          checked={settings.rememberMapView}
          onChange={(value) => updateSetting('rememberMapView', value)}
        />
      </section>

      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
      >
        <ArrowPathIcon className="h-4 w-4" />
        Reset settings
      </button>
    </div>
  );
}