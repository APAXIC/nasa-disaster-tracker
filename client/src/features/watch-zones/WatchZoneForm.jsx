import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

const inputClassName =
  'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500';

export default function WatchZoneForm({ form, editingZone, formError, isSubmitting, isPickingLocation, updateField, onSubmit, onClose, onStartPickingLocation }) {
  return (
    <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-gray-700 bg-gray-800/60 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-100">
              {editingZone ? 'Edit Watch Zone' : 'New Watch Zone'}
            </h3>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close form"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label
              htmlFor="zone-name"
              className="mb-1.5 block text-xs font-medium text-gray-400"
            >
              Zone Name
            </label>
            <input
              id="zone-name"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="e.g. Home"
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="zone-latitude"
                className="mb-1.5 block text-xs font-medium text-gray-400"
              >
                Latitude
              </label>
              <input
                id="zone-latitude"
                type="number"
                required
                min="-90"
                max="90"
                step="any"
                value={form.latitude}
                onChange={(event) =>
                  updateField('latitude', event.target.value)
                }
                placeholder="53.3498"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="zone-longitude"
                className="mb-1.5 block text-xs font-medium text-gray-400"
              >
                Longitude
              </label>
              <input
                id="zone-longitude"
                type="number"
                required
                min="-180"
                max="180"
                step="any"
                value={form.longitude}
                onChange={(event) =>
                  updateField('longitude', event.target.value)
                }
                placeholder="-6.2603"
                className={inputClassName}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onStartPickingLocation}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-orange-500/50 bg-orange-500/10 px-3 py-2.5 text-sm font-medium text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
          >
            <MapPinIcon className="mr-2 inline h-4 w-4" />
            {isPickingLocation ? 'Click on the map...' : 'Pick location on map'}
          </button>

          {isPickingLocation && (
            <p className="text-xs leading-5 text-orange-300">
              Click anywhere on the map to select the centre of this watch zone.
            </p>
          )}

          <div>
            <label
              htmlFor="zone-radius"
              className="mb-1.5 block text-xs font-medium text-gray-400"
            >
              Radius (km)
            </label>
            <input
              id="zone-radius"
              type="number"
              required
              min="0.1"
              step="any"
              value={form.radiusKm}
              onChange={(event) =>
                updateField('radiusKm', event.target.value)
              }
              className={inputClassName}
            />
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gray-700 px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : editingZone
                  ? 'Save Changes'
                  : 'Create Zone'}
            </button>
          </div>
    </form>
  );
}
