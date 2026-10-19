import { useEffect, useRef, useState } from 'react';
import WatchZoneForm from './WatchZoneForm.jsx';
import WatchZoneCard from './WatchZoneCard.jsx';
import {
  MapPinIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '',
  latitude: '',
  longitude: '',
  radiusKm: '50'
};

export default function WatchZonesPanel({
                                          user,
                                          watchZones = [],
                                          onCreateWatchZone,
                                          onUpdateWatchZone,
                                          onDeleteWatchZone,
                                          onToggleWatchZoneNotifications,
                                          pickedLocation,
                                          isPickingLocation,
                                          onStartPickingLocation,
                                          onCancelPickingLocation,
                                          onPreviewChange
                                        }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState(null);
  const [togglingZoneId, setTogglingZoneId] = useState(null);
  const appliedPickedLocationRef = useRef(null);

  useEffect(() => {
    if (!pickedLocation) {
      appliedPickedLocationRef.current = null;
      return;
    }

    if (
      !isFormOpen ||
      editingZone ||
      appliedPickedLocationRef.current === pickedLocation
    ) {
      return;
    }

    appliedPickedLocationRef.current = pickedLocation;

    const latitude = String(pickedLocation.lat);
    const longitude = String(pickedLocation.lng);
    const radiusKm = Number(form.radiusKm);

    setForm((current) => ({
      ...current,
      latitude,
      longitude
    }));
    setFormError('');

    onPreviewChange?.(
      Number.isFinite(radiusKm) && radiusKm > 0
        ? {
            latitude: pickedLocation.lat,
            longitude: pickedLocation.lng,
            radiusKm
          }
        : null
    );
  }, [
    pickedLocation,
    isFormOpen,
    editingZone,
    form.radiusKm,
    onPreviewChange
  ]);

  const updateField = (field, value) => {
    const nextForm = {
      ...form,
      [field]: value
    };

    setForm(nextForm);

    const latitude = Number(nextForm.latitude);
    const longitude = Number(nextForm.longitude);
    const radiusKm = Number(nextForm.radiusKm);

    const hasValidCoordinates =
      nextForm.latitude.trim() !== '' &&
      nextForm.longitude.trim() !== '' &&
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180;

    const hasValidRadius =
      nextForm.radiusKm.trim() !== '' &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0;

    onPreviewChange?.(
      hasValidCoordinates && hasValidRadius
        ? { latitude, longitude, radiusKm }
        : null
    );
  };

  const openCreateForm = () => {
    setEditingZone(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
    onPreviewChange?.(null);
    onCancelPickingLocation?.();
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

    onPreviewChange?.(null);
    onCancelPickingLocation?.();
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

      onPreviewChange?.(null);
      onCancelPickingLocation?.();
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
        <WatchZoneForm
          form={form}
          editingZone={editingZone}
          formError={formError}
          isSubmitting={isSubmitting}
          isPickingLocation={isPickingLocation}
          updateField={updateField}
          onSubmit={handleSubmit}
          onClose={closeForm}
          onStartPickingLocation={() => onStartPickingLocation?.()}
        />
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
            <WatchZoneCard
              key={zone.id}
              zone={zone}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onToggleNotifications={handleToggleNotifications}
              isSubmitting={isSubmitting}
              deletingZoneId={deletingZoneId}
              togglingZoneId={togglingZoneId}
            />
          ))}
        </div>
      )}
    </div>
  );
}