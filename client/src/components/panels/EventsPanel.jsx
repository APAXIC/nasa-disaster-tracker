
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { fetchHistoricalCategories } from '../../services/api';

const DEFAULT_DISPLAY_LIMIT = '';
const MAX_DISPLAY_LIMIT = 1000000;

function getEventCategories(event) {
  return (event.categories || []).map((category) => ({
    id: String(category.id ?? category.title ?? category.name ?? ''),
    title: category.title ?? category.name ?? category.id ?? 'Unknown'
  }));
}

function getEventDate(event) {
  const dates = (event.geometry || [])
    .map((point) => Date.parse(point.date || ''))
    .filter(Number.isFinite);

  if (dates.length > 0) {
    return Math.max(...dates);
  }

  const fallbackDate = event.closed_at ?? event.closed ?? event.date;

  if (!fallbackDate) return null;

  const timestamp = Date.parse(fallbackDate);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getMagnitudeInfo(event) {
  const hasEventMagnitude =
    event.magnitudeValue !== null &&
    event.magnitudeValue !== undefined &&
    event.magnitudeValue !== '' &&
    Number.isFinite(Number(event.magnitudeValue));

  if (hasEventMagnitude) {
    return {
      value: Number(event.magnitudeValue),
      unit: event.magnitudeUnit || ''
    };
  }

  const magnitudes = (event.geometry || [])
    .filter(
      (point) =>
        point.magnitudeValue !== null &&
        point.magnitudeValue !== undefined &&
        point.magnitudeValue !== '' &&
        Number.isFinite(Number(point.magnitudeValue))
    )
    .map((point) => ({
      value: Number(point.magnitudeValue),
      unit: point.magnitudeUnit || '',
      date: Date.parse(point.date || '')
    }))
    .sort((a, b) => {
      const dateA = Number.isFinite(a.date) ? a.date : -Infinity;
      const dateB = Number.isFinite(b.date) ? b.date : -Infinity;
      return dateB - dateA;
    });

  return magnitudes[0] || null;
}

function getDistance(event, userLocation) {
  if (
    event.distance_km !== null &&
    event.distance_km !== undefined &&
    event.distance_km !== '' &&
    Number.isFinite(Number(event.distance_km))
  ) {
    return Number(event.distance_km);
  }

  if (
    !userLocation ||
    !Number.isFinite(Number(userLocation.lat)) ||
    !Number.isFinite(Number(userLocation.lng))
  ) {
    return null;
  }

  const coordinates = getEventCoordinates(event);
  if (!coordinates) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRadians(Number(userLocation.lat));
  const lat2 = toRadians(coordinates.lat);
  const deltaLat = toRadians(coordinates.lat - Number(userLocation.lat));
  const deltaLng = toRadians(coordinates.lng - Number(userLocation.lng));

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getEventCoordinates(event) {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);

  if (
    event.latitude != null &&
    event.longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { lat: latitude, lng: longitude };
  }

  const geometry = event.geometry || [];

  for (let i = geometry.length - 1; i >= 0; i -= 1) {
    const coordinates =
      geometry[i]?.coordinates ??
      geometry[i]?.geometry?.coordinates;

    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      Number.isFinite(Number(coordinates[0])) &&
      Number.isFinite(Number(coordinates[1]))
    ) {
      return {
        lat: Number(coordinates[1]),
        lng: Number(coordinates[0])
      };
    }
  }

  return null;
}

function compareMissingLast(a, b, direction = 1) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return (a - b) * direction;
}

function sortEvents(events, sortBy, userLocation) {
  return [...events].sort((a, b) => {
    if (sortBy === 'newest' || sortBy === 'oldest') {
      const dateA = getEventDate(a);
      const dateB = getEventDate(b);

      const result = compareMissingLast(
        dateA,
        dateB,
        sortBy === 'newest' ? -1 : 1
      );

      return result || String(a.title ?? '').localeCompare(String(b.title ?? ''));
    }

    if (sortBy === 'nearest' || sortBy === 'farthest') {
      const result = compareMissingLast(
        getDistance(a, userLocation),
        getDistance(b, userLocation),
        sortBy === 'nearest' ? 1 : -1
      );

      return result || String(a.title ?? '').localeCompare(String(b.title ?? ''));
    }

    if (sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc') {
      const magnitudeA = getMagnitudeInfo(a);
      const magnitudeB = getMagnitudeInfo(b);

      if (!magnitudeA && !magnitudeB) {
        return String(a.title ?? '').localeCompare(String(b.title ?? ''));
      }

      if (!magnitudeA) return 1;
      if (!magnitudeB) return -1;

      const unitA = magnitudeA.unit || '';
      const unitB = magnitudeB.unit || '';

      if (unitA !== unitB) {
        return unitA.localeCompare(unitB);
      }

      const direction = sortBy === 'magnitude-asc' ? 1 : -1;
      return (
        (magnitudeA.value - magnitudeB.value) * direction ||
        String(a.title ?? '').localeCompare(String(b.title ?? ''))
      );
    }

    return 0;
  });
}

function formatEventDate(timestamp) {
  if (timestamp === null) return 'Date unavailable';

  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function EventsPanel({
                                      events = [],
                                      selectedEvent,
                                      onSelectEvent,
                                      onLocateUser,
                                      onResetSearch,
                                      isSearchingNearby,
                                      searchRadius,
                                      setSearchRadius,
                                      onDisplayEventsChange,
                                      userLocation
                                    }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [displayLimitInput, setDisplayLimitInput] =
    useState(DEFAULT_DISPLAY_LIMIT);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const cardRefs = useRef(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError('');

      try {
        const response = await fetchHistoricalCategories();
        const items = Array.isArray(response)
          ? response
          : response?.data ?? response?.categories ?? [];

        if (!cancelled) {
          setCategories(
            items
              .map((category) => ({
                id: String(category.id ?? ''),
                title: category.title ?? category.name ?? category.id ?? 'Unknown'
              }))
              .filter((category) => category.id)
              .sort((a, b) => a.title.localeCompare(b.title))
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load event categories:', error);
          setCategoriesError('Could not load categories.');
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayLimit = useMemo(() => {
    const trimmed = displayLimitInput.trim();

    if (!trimmed) return Infinity;

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed < 1) return Infinity;

    return Math.min(parsed, MAX_DISPLAY_LIMIT);
  }, [displayLimitInput]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = events.filter((event) => {
      const matchesQuery = String(event.title ?? '')
        .toLowerCase()
        .includes(normalizedQuery);

      const matchesCategory =
        !selectedCategory ||
        getEventCategories(event).some(
          (category) => category.id === selectedCategory
        );

      return matchesQuery && matchesCategory;
    });

    return sortEvents(filtered, sortBy, userLocation).slice(0, displayLimit);
  }, [
    events,
    query,
    selectedCategory,
    sortBy,
    userLocation,
    displayLimit
  ]);

  useEffect(() => {
    onDisplayEventsChange?.(filteredEvents);
  }, [filteredEvents, onDisplayEventsChange]);

  useEffect(() => {
    if (!selectedEvent || !query.trim()) return;

    const selectedIsVisible = filteredEvents.some(
      (event) => String(event.id) === String(selectedEvent.id)
    );

    if (!selectedIsVisible) setQuery('');
  }, [selectedEvent?.id, filteredEvents, query]);

  useEffect(() => {
    if (!selectedEvent) return;

    cardRefs.current
      .get(String(selectedEvent.id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedEvent?.id, filteredEvents]);

  const locationAvailable =
    userLocation &&
    Number.isFinite(Number(userLocation.lat)) &&
    Number.isFinite(Number(userLocation.lng));

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events..."
          aria-label="Search events"
          className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500"
        />
      </div>

      <button
        type="button"
        onClick={onLocateUser}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        <MapPinIcon className="h-4 w-4" />
        Find Nearby Events
      </button>

      {isSearchingNearby && (
        <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-800/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="search-radius" className="text-gray-300">
              Search radius
            </label>
            <span className="font-semibold text-blue-400">
              {searchRadius} km
            </span>
          </div>

          <input
            id="search-radius"
            type="range"
            min="100"
            max="5000"
            step="100"
            value={searchRadius}
            onChange={(event) =>
              setSearchRadius(Number(event.target.value))
            }
            className="w-full accent-blue-500"
          />

          <button
            type="button"
            onClick={onResetSearch}
            className="flex items-center gap-2 text-xs text-gray-400 transition hover:text-white"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Show all global events
          </button>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3">
        <h3 className="text-sm font-semibold text-gray-200">
          Filters & Sorting
        </h3>

        <div className="space-y-1.5">
          <label
            htmlFor="event-category"
            className="block text-xs text-gray-400"
          >
            Category
          </label>

          <select
            id="event-category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>

          {categoriesLoading && (
            <p className="text-xs text-gray-500">Loading categories...</p>
          )}
          {categoriesError && (
            <p className="text-xs text-red-400">{categoriesError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="event-sort"
            className="block text-xs text-gray-400"
          >
            Sort by
          </label>

          <select
            id="event-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
          >
            <option value="newest">Date: newest first</option>
            <option value="oldest">Date: oldest first</option>
            <option value="magnitude-desc">Magnitude: highest first</option>
            <option value="magnitude-asc">Magnitude: lowest first</option>
            {locationAvailable && (
              <>
                <option value="nearest">Distance: nearest first</option>
                <option value="farthest">Distance: farthest first</option>
              </>
            )}
          </select>

          {!locationAvailable && (
            <p className="text-xs text-gray-500">
              Enable location access to sort events by distance.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="event-display-limit"
            className="block text-xs text-gray-400"
          >
            Maximum events on map and in list
          </label>

          <input
            id="event-display-limit"
            type="number"
            min="1"
            max={MAX_DISPLAY_LIMIT}
            step="1"
            value={displayLimitInput}
            placeholder="All available events"
            onChange={(event) => setDisplayLimitInput(event.target.value)}
            onBlur={() => {
              const trimmed = displayLimitInput.trim();

              if (!trimmed) {
                setDisplayLimitInput('');
                return;
              }

              const parsed = Number(trimmed);

              if (!Number.isInteger(parsed) || parsed < 1) {
                setDisplayLimitInput('');
              } else if (parsed > MAX_DISPLAY_LIMIT) {
                setDisplayLimitInput(String(MAX_DISPLAY_LIMIT));
              }
            }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
          />

          <p className="text-xs text-gray-500">
            Default: all available events. Clear the field to show all.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-sm font-semibold text-gray-200">Events</h3>
        <span className="text-xs text-gray-500">
          {filteredEvents.length} shown
          {filteredEvents.length !== events.length && ` · ${events.length} loaded`}
        </span>
      </div>

      <div className="space-y-2">
        {filteredEvents.map((event) => {
          const isSelected =
            String(selectedEvent?.id) === String(event.id);

          const magnitude = getMagnitudeInfo(event);
          const distance = getDistance(event, userLocation);
          const eventDate = getEventDate(event);

          const categoryTitles = getEventCategories(event)
            .map((category) => category.title)
            .join(', ');

          return (
            <button
              key={event.id}
              ref={(element) => {
                const id = String(event.id);

                if (element) {
                  cardRefs.current.set(id, element);
                } else {
                  cardRefs.current.delete(id);
                }
              }}
              type="button"
              onClick={() => onSelectEvent(event)}
              aria-pressed={isSelected}
              className={`w-full rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/70'
              }`}
            >
              <span className="block text-sm font-medium text-gray-100">
                {event.title}
              </span>

              {categoryTitles && (
                <span className="mt-1 block text-xs text-gray-400">
                  {categoryTitles}
                </span>
              )}

              <span className="mt-1 block text-xs text-gray-400">
                Date: {formatEventDate(eventDate)}
              </span>

              <span className="mt-1 block text-xs text-orange-300">
                {magnitude
                  ? `Magnitude: ${magnitude.value}${magnitude.unit ? ` ${magnitude.unit}` : ''}`
                  : 'Magnitude: unavailable'}
              </span>

              {distance !== null ? (
                <span className="mt-1 block text-xs text-blue-400">
                  {distance < 10
                    ? `${distance.toFixed(1)} km from you`
                    : `${Math.round(distance)} km from you`}
                </span>
              ) : (
                <span className="mt-1 block text-xs text-gray-500">
                  Distance unavailable
                </span>
              )}
            </button>
          );
        })}

        {filteredEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No events match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
