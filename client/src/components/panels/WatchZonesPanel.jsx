import { useState } from 'react';
import {
  MapPinIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BellIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '',
  latitude: '',
  longitude: '',
  radiusKm: '50'
};

const inputClassName =
  'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500';

export default function WatchZonesPanel({
                                          user,
                                          watchZones = [],
                                          onCreateWatchZone,
                                          onUpdateWatchZone,
                                          onDeleteWatchZone,
                                          onToggleWatchZoneNotifications
                                        }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState(null);
  const [togglingZoneId, setTogglingZoneId] = useState(null);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingZone(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (zone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name ?? '',
      latitude: String(zone.latitude ?? ''),
      longitude: String(zone.longitude ?? ''),
      radiusKm: String(zone.radius_km ?? 50)
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;

    setIsFormOpen(false);
    setEditingZone(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const name = form.name.trim();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radiusKm = Number(form.radiusKm);

    if (!name) {
      setFormError('Please enter a zone name.');
      return;
    }

    if (
      form.latitude.trim() === '' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setFormError('Latitude must be between -90 and 90.');
      return;
    }

    if (
      form.longitude.trim() === '' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setFormError('Longitude must be between -180 and 180.');
      return;
    }

    if (
      form.radiusKm.trim() === '' ||
      !Number.isFinite(radiusKm) ||
      radiusKm <= 0
    ) {
      setFormError('Radius must be greater than zero.');
      return;
    }

    const zoneData = { name, latitude, longitude, radiusKm };

    setIsSubmitting(true);

    try {
      if (editingZone) {
        await onUpdateWatchZone(editingZone.id, zoneData);
      } else {
        await onCreateWatchZone(zoneData);
      }

      setIsFormOpen(false);
      setEditingZone(null);
      setForm(EMPTY_FORM);
      setFormError('');
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to save watch zone.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (zone) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${zone.name}"?`
    );

    if (!confirmed) return;

    setDeletingZoneId(zone.id);
    setFormError('');

    try {
      await onDeleteWatchZone(zone.id);

      if (editingZone?.id === zone.id) {
        setIsFormOpen(false);
        setEditingZone(null);
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete watch zone.'
      );
    } finally {
      setDeletingZoneId(null);
    }
  };

  const handleToggleNotifications = async (zone) => {
    if (!onToggleWatchZoneNotifications || togglingZoneId !== null) {
      return;
    }

    setTogglingZoneId(zone.id);

    try {
      await onToggleWatchZoneNotifications(zone.id, !zone.is_muted);
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update notification settings.'
      );
    } finally {
      setTogglingZoneId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <div className="mb-4 rounded-2xl bg-gray-800 p-4">
          <MapPinIcon className="h-8 w-8 text-orange-400" />
        </div>

        <h3 className="text-sm font-semibold text-gray-100">
          Personal Watch Zones
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-gray-400">
          Sign in to create watch zones and receive alerts for events
          detected within their radius.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-300">
            Monitor locations that matter to you.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {watchZones.length} {watchZones.length === 1 ? 'zone' : 'zones'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={isSubmitting}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>

      {formError && !isFormOpen && (
        <p
          role="alert"
          className="rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-300"
        >
          {formError}
        </p>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-700 bg-gray-800/60 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-100">
              {editingZone ? 'Edit Watch Zone' : 'New Watch Zone'}
            </h3>

            <button
              type="button"
              onClick={closeForm}
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
              onClick={closeForm}
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
      )}

      {watchZones.length === 0 && !isFormOpen ? (
        <div className="rounded-xl border border-dashed border-gray-700 px-4 py-10 text-center">
          <MapPinIcon className="mx-auto h-7 w-7 text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-300">
            No watch zones yet
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Add a location to start monitoring events around it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchZones.map((zone) => (
            <article
              key={zone.id}
              className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 transition hover:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <MapPinIcon className="h-5 w-5 text-orange-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-sm font-semibold text-gray-100">
                    {zone.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    {zone.radius_km} km radius
                  </p>
                  <p className="mt-1 break-words text-xs text-gray-500">
                    {Number(zone.latitude).toFixed(4)},{' '}
                    {Number(zone.longitude).toFixed(4)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditForm(zone)}
                    disabled={isSubmitting || deletingZoneId === zone.id}
                    title="Edit watch zone"
                    aria-label={`Edit ${zone.name}`}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-blue-400 disabled:opacity-50"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(zone)}
                    disabled={deletingZoneId === zone.id || isSubmitting}
                    title="Delete watch zone"
                    aria-label={`Delete ${zone.name}`}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-800 pt-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-200">
                      Zone notifications
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {zone.is_muted
                        ? 'Notifications are muted'
                        : 'Notifications are enabled'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotifications(zone)}
                    disabled={
                      togglingZoneId !== null ||
                      isSubmitting ||
                      deletingZoneId === zone.id
                    }
                    aria-pressed={!zone.is_muted}
                    aria-label={
                      zone.is_muted
                        ? `Enable notifications for ${zone.name}`
                        : `Mute notifications for ${zone.name}`
                    }
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      zone.is_muted
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-green-800 bg-green-950/30 text-green-300 hover:bg-green-950/60'
                    }`}
                  >
                    {zone.is_muted ? (
                      <BellSlashIcon className="h-4 w-4" />
                    ) : (
                      <BellIcon className="h-4 w-4" />
                    )}

                    {togglingZoneId === zone.id
                      ? 'Saving...'
                      : zone.is_muted
                        ? 'Enable'
                        : 'Mute'}
                  </button>
                </div>
              </div>

              {deletingZoneId === zone.id && (
                <p className="mt-2 text-xs text-gray-500">Deleting...</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}