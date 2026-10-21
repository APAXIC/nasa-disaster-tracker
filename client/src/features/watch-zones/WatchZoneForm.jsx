import {
  CheckIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const inputClassName =
  'w-full min-w-0 h-11 rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export default function WatchZoneForm({
  form,
  editingZone,
  formError,
  isSubmitting,
  isPickingLocation,
  updateField,
  onSubmit,
  onClose,
  onStartPickingLocation
}) {
  return (
    <form onSubmit={onSubmit} className="watch-zone-form rounded-2xl border border-slate-700/70 bg-slate-900/50">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-100">
            {editingZone ? 'Edit Watch Zone' : 'New Watch Zone'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">Choose a location and monitoring radius.</p>
        </div>

      </div>

      <div className="space-y-2">
        <label htmlFor="zone-name" className="block text-sm font-medium text-slate-300">Zone name</label>
        <input id="zone-name" type="text" required maxLength={100} value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="e.g. Home" className={inputClassName} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="zone-latitude" className="block text-sm font-medium text-slate-300">Latitude</label>
          <input id="zone-latitude" type="number" required min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField('latitude', event.target.value)} placeholder="53.3498" className={inputClassName} />
        </div>
        <div className="min-w-0 space-y-2">
          <label htmlFor="zone-longitude" className="block text-sm font-medium text-slate-300">Longitude</label>
          <input id="zone-longitude" type="number" required min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField('longitude', event.target.value)} placeholder="-6.2603" className={inputClassName} />
        </div>
      </div>

      <button type="button" onClick={onStartPickingLocation} disabled={isSubmitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50">
        <MapPinIcon className="h-5 w-5 shrink-0" />
        {isPickingLocation ? 'Click on the map...' : 'Pick location on map'}
      </button>
      {isPickingLocation && <p className="text-sm leading-6 text-blue-300">Click anywhere on the map to select the centre of this watch zone.</p>}

      <div className="space-y-2">
        <label htmlFor="zone-radius" className="block text-sm font-medium text-slate-300">Radius (km)</label>
        <input id="zone-radius" type="number" required min="0.1" step="any" value={form.radiusKm} onChange={(event) => updateField('radiusKm', event.target.value)} className={inputClassName} />
      </div>

      {formError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{formError}</p>}

      <div className="watch-zone-form-actions flex items-center justify-end border-t border-slate-700/70">
        <button type="button" onClick={onClose} disabled={isSubmitting} title="Cancel" aria-label="Cancel" className="watch-zone-action flex shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-200 transition hover:bg-slate-700 disabled:opacity-50">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <button type="submit" disabled={isSubmitting} title={editingZone ? 'Save changes' : 'Create zone'} aria-label={editingZone ? 'Save changes' : 'Create zone'} className="watch-zone-action flex shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50">
          {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <CheckIcon className="h-5 w-5" />}
        </button>
      </div>
    </form>
  );
}
