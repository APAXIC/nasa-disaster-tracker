import React, { useEffect, useRef, useState } from 'react';
import {
  Bars3Icon,
  BellIcon,
  UserIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function NavigationOverlay({
                                            events,
                                            selectedEvent,
                                            onSelectEvent,
                                            onLocateUser,
                                            onResetSearch,
                                            isSearchingNearby,
                                            searchRadius,
                                            setSearchRadius,
                                            unreadNotificationsCount = 0,
                                            user,
                                            watchZones = [], // <-- Added watchZones prop
                                            onOpenAuthModal,
                                            onLogout,
                                            onCreateWatchZone,
                                            onUpdateWatchZone,
                                            onDeleteWatchZone
                                          }) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isZoneFormOpen, setIsZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radiusKm: 50
  });
  const [zoneFormError, setZoneFormError] = useState('');
  const [isZoneSubmitting, setIsZoneSubmitting] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState(null);

  const eventCardRefs = useRef(new Map());

  useEffect(() => {
    if (!selectedEvent) return;

    // Open the event panel when an event is selected on the map.
    setRightOpen(true);

    // Clear the search if it hides the selected event.
    const isVisible = filteredEvents.some(
      (event) => String(event.id) === String(selectedEvent.id)
    );

    if (!isVisible) {
      setSearchQuery('');
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!selectedEvent || !rightOpen) return;

    const selectedCard = eventCardRefs.current.get(
      String(selectedEvent.id)
    );

    selectedCard?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [selectedEvent?.id, rightOpen, searchQuery]);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateZoneForm = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      latitude: '',
      longitude: '',
      radiusKm: 50
    });
    setZoneFormError('');
    setIsZoneFormOpen(true);
  };

  const openEditZoneForm = (zone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      latitude: String(zone.latitude),
      longitude: String(zone.longitude),
      radiusKm: zone.radius_km
    });
    setZoneFormError('');
    setIsZoneFormOpen(true);
  };

  const closeZoneForm = () => {
    setIsZoneFormOpen(false);
    setEditingZone(null);
    setZoneFormError('');
  };

  const handleZoneFormSubmit = async (e) => {
    e.preventDefault();
    setZoneFormError('');

    const latitude = Number(zoneForm.latitude);
    const longitude = Number(zoneForm.longitude);
    const radiusKm = Number(zoneForm.radiusKm);
    const name = zoneForm.name.trim();

    if (!name) {
      setZoneFormError('Please enter a zone name.');
      return;
    }

    if (
      zoneForm.latitude.trim() === '' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setZoneFormError('Latitude must be between -90 and 90.');
      return;
    }

    if (
      zoneForm.longitude.trim() === '' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setZoneFormError('Longitude must be between -180 and 180.');
      return;
    }

    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      setZoneFormError('Radius must be greater than zero.');
      return;
    }

    const zoneData = {
      name,
      latitude,
      longitude,
      radiusKm
    };

    setIsZoneSubmitting(true);

    try {
      if (editingZone) {
        await onUpdateWatchZone(editingZone.id, zoneData);
      } else {
        await onCreateWatchZone(zoneData);
      }

      closeZoneForm();
    } catch (error) {
      setZoneFormError(
        error.response?.data?.error || 'Failed to save watch zone.'
      );
    } finally {
      setIsZoneSubmitting(false);
    }
  };

  const handleZoneDelete = async (zone) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${zone.name}"?`
    );

    if (!confirmed) return;

    setDeletingZoneId(zone.id);
    setZoneFormError('');

    try {
      await onDeleteWatchZone(zone.id);

      if (editingZone?.id === zone.id) {
        closeZoneForm();
      }
    } catch (error) {
      setZoneFormError(
        error.response?.data?.error || 'Failed to delete watch zone.'
      );
    } finally {
      setDeletingZoneId(null);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex justify-between overflow-hidden">

      <div
        className={`pointer-events-auto h-full bg-gray-900/95 backdrop-blur-md border-r border-gray-800 text-white transition-all duration-300 flex ${
          leftOpen ? 'w-80' : 'w-16'
        }`}
      >
        {/* Strip Icons (Always Visible) */}
        <div className="w-16 h-full flex flex-col justify-between items-center py-4 border-r border-gray-800/50">
          <div className="flex flex-col gap-6 items-center">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
              title="Toggle Menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <button className="relative p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
              <BellIcon className="w-6 h-6" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={user ? onLogout : onOpenAuthModal}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
            title={user ? 'Log Out' : 'Sign In'}
            aria-label={user ? 'Log Out' : 'Sign In'}
          >
            {user ? (
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            ) : (
              <UserIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {leftOpen && (
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-orange-500">Control Center</h2>
                <button
                  onClick={() => setLeftOpen(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={onLocateUser}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition"
                >
                  Find Nearby Disasters
                </button>

                {isSearchingNearby && (
                  <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Search Radius</span>
                      <span className="font-semibold text-blue-400">{searchRadius} km</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <button
                      onClick={onResetSearch}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Reset to all global events
                    </button>
                  </div>
                )}

                <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Watch Zones
                    </h3>

                    {user && (
                      <span className="text-[11px] font-bold text-orange-400 bg-orange-950/60 border border-orange-800/50 px-2 py-0.5 rounded-full">
        {watchZones.length} Total
      </span>
                    )}
                  </div>

                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={openCreateZoneForm}
                        disabled={isZoneSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Watch Zone
                      </button>

                      {watchZones.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {watchZones.map((zone) => (
                            <div
                              key={zone.id}
                              className="p-3 bg-gray-900/80 rounded-lg border border-gray-800 hover:border-gray-700 transition"
                            >
                              <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-200 break-words">
                                    {zone.name}
                                  </p>

                                  <span className="text-[10px] text-gray-400 block mt-1">
                    {zone.radius_km} km radius
                  </span>

                                  <span className="text-[10px] text-gray-500 block mt-1">
                    {Number(zone.latitude).toFixed(4)},{' '}
                                    {Number(zone.longitude).toFixed(4)}
                  </span>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditZoneForm(zone)}
                                    title="Edit watch zone"
                                    aria-label={`Edit ${zone.name}`}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleZoneDelete(zone)}
                                    disabled={deletingZoneId === zone.id}
                                    title="Delete watch zone"
                                    aria-label={`Delete ${zone.name}`}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 disabled:opacity-50 rounded transition"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">
                          No watch zones created yet.
                        </p>
                      )}

                      {zoneFormError && !isZoneFormOpen && (
                        <p role="alert" className="text-xs text-red-400 mt-3">
                          {zoneFormError}
                        </p>
                      )}

                      {isZoneFormOpen && (
                        <form
                          onSubmit={handleZoneFormSubmit}
                          className="mt-4 p-3 bg-gray-900 rounded-xl border border-gray-700 space-y-3"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-100">
                              {editingZone ? 'Edit Watch Zone' : 'New Watch Zone'}
                            </h4>

                            <button
                              type="button"
                              onClick={closeZoneForm}
                              disabled={isZoneSubmitting}
                              className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                              aria-label="Close watch zone form"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label
                              htmlFor="zone-name"
                              className="block text-xs text-gray-400 mb-1"
                            >
                              Zone Name
                            </label>
                            <input
                              id="zone-name"
                              type="text"
                              required
                              maxLength={100}
                              value={zoneForm.name}
                              onChange={(e) =>
                                setZoneForm({ ...zoneForm, name: e.target.value })
                              }
                              placeholder="e.g. Home"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="zone-latitude"
                              className="block text-xs text-gray-400 mb-1"
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
                              value={zoneForm.latitude}
                              onChange={(e) =>
                                setZoneForm({ ...zoneForm, latitude: e.target.value })
                              }
                              placeholder="53.3498"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="zone-longitude"
                              className="block text-xs text-gray-400 mb-1"
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
                              value={zoneForm.longitude}
                              onChange={(e) =>
                                setZoneForm({ ...zoneForm, longitude: e.target.value })
                              }
                              placeholder="-6.2603"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="zone-radius"
                              className="block text-xs text-gray-400 mb-1"
                            >
                              Radius (km)
                            </label>
                            <input
                              id="zone-radius"
                              type="number"
                              required
                              min="0.1"
                              step="any"
                              value={zoneForm.radiusKm}
                              onChange={(e) =>
                                setZoneForm({ ...zoneForm, radiusKm: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          {zoneFormError && (
                            <p role="alert" className="text-xs text-red-400">
                              {zoneFormError}
                            </p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={closeZoneForm}
                              disabled={isZoneSubmitting}
                              className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs font-semibold rounded-lg transition"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={isZoneSubmitting}
                              className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                            >
                              {isZoneSubmitting
                                ? 'Saving...'
                                : editingZone
                                  ? 'Save Changes'
                                  : 'Create Zone'}
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Sign in to create and manage watch zones.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <span className="text-xs text-gray-500 block">
                {user ? `Logged in as ${user.email}` : 'Not Authenticated'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="relative pointer-events-auto h-full">
        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            className="m-4 p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-lg transition transform hover:scale-105"
            title="Open Disaster Search"
          >
            <ExclamationTriangleIcon className="w-6 h-6" />
          </button>
        )}

        {rightOpen && (
          <div className="w-80 h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-800 text-white p-5 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-orange-500" />
                Disaster Filter
              </h2>
              <button
                onClick={() => setRightOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search hazards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-orange-500 mb-4"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-xs text-gray-400 block mb-2">
                Showing {filteredEvents.length} events
              </span>
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  ref={(element) => {
                    const id = String(evt.id);

                    if (element) {
                      eventCardRefs.current.set(id, element);
                    } else {
                      eventCardRefs.current.delete(id);
                    }
                  }}
                  onClick={() => onSelectEvent(evt)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                    selectedEvent?.id === evt.id
                      ? 'bg-gray-800 border-orange-500'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <h4 className="text-xs font-semibold text-gray-200">{evt.title}</h4>
                  {evt.distance_km && (
                    <span className="text-[11px] text-blue-400 block mt-1">
                      {Math.round(evt.distance_km)} km away
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}