import SettingToggle from './SettingToggle.jsx';
import {
  MapIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon,
  EyeIcon,
  MapPinIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const mapOptions = [
  { id: 'standard', label: 'Standard', preview: '/map-previews/standard.jpg' },
  { id: 'topographic', label: 'Topographic', preview: '/map-previews/topographic.jpg' },
  { id: 'satellite', label: 'Satellite', preview: '/map-previews/satellite.jpg' }
];

export default function SettingsPanel({ settings, onChange, onReset, isAuthenticated = false }) {
  const updateSetting = (key, value) => {
    onChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="settings-panel">
      <section className="settings-section">
        <h3 className="settings-section-title">
          <MapIcon className="h-5 w-5" /> Map appearance
        </h3>

        <fieldset className="settings-fieldset">
          <legend className="settings-field-label">Map style</legend>
          <div className="settings-map-grid">
            {mapOptions.map((option) => {
              const selected = settings.mapStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`settings-map-option ${selected ? 'is-active' : ''}`}
                  onClick={() => updateSetting('mapStyle', option.id)}
                  aria-pressed={selected}
                  title={`${option.label} map`}
                >
                  <span className={`settings-map-thumbnail settings-map-thumbnail-${option.id}`}>
                    <img
                      src={option.preview}
                      alt=""
                      loading="lazy"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                    {selected && (
                      <span className="settings-map-check" aria-hidden="true">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                  <span className="settings-map-name">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="settings-fieldset">
          <legend className="settings-field-label">Application theme</legend>
          <div className="settings-theme-options">
            <button
              type="button"
              className={`settings-theme-option ${settings.theme === 'dark' ? 'is-active' : ''}`}
              aria-pressed={settings.theme === 'dark'}
              onClick={() => updateSetting('theme', 'dark')}
            >
              <MoonIcon className="h-5 w-5" /> Dark
            </button>
            <button
              type="button"
              className={`settings-theme-option ${settings.theme === 'light' ? 'is-active' : ''}`}
              aria-pressed={settings.theme === 'light'}
              onClick={() => updateSetting('theme', 'light')}
            >
              <SunIcon className="h-5 w-5" /> Light
            </button>
          </div>
        </fieldset>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title"><EyeIcon className="h-5 w-5" /> Map layers</h3>
        <div className="settings-toggle-list">
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
            description={isAuthenticated ? 'Show your saved monitoring zones.' : 'Sign in to view your personal watch zones.'}
            checked={isAuthenticated && settings.showWatchZones}
            disabled={!isAuthenticated}
            onChange={(value) => updateSetting('showWatchZones', value)}
          />
          {!isAuthenticated && <p className="settings-note">Watch zones are available only to signed-in users.</p>}
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title"><MapPinIcon className="h-5 w-5" /> Map behavior</h3>
        <div className="settings-toggle-list">
          <SettingToggle
            label="Remember map view"
            description="Save the map center and zoom between visits."
            checked={settings.rememberMapView}
            onChange={(value) => updateSetting('rememberMapView', value)}
          />
        </div>
      </section>

      <button type="button" onClick={onReset} className="settings-reset-button">
        <ArrowPathIcon className="h-5 w-5" /> Reset settings
      </button>
    </div>
  );
}
