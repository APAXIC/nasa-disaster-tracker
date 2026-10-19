
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { fetchHistoricalCategories } from '../../services/eventsApi.js';
import {
  getDistance,
  getEventCategories,
  getEventDate,
  getMagnitudeInfo
} from './eventUtils';
import EventListItem from './EventListItem.jsx';
import EventSearchInput from './EventSearchInput.jsx';

const DEFAULT_DISPLAY_LIMIT = '';
const MAX_DISPLAY_LIMIT = 1000000;
const EVENT_FILTERS_KEY = 'disaster-map-event-filters';

function loadEventFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(EVENT_FILTERS_KEY) || '{}');
    return {
      query: typeof saved.query === 'string' ? saved.query : '',
      selectedCategory: typeof saved.selectedCategory === 'string' ? saved.selectedCategory : '',
      sortBy: ['newest', 'oldest', 'nearest', 'farthest', 'magnitude-asc', 'magnitude-desc'].includes(saved.sortBy) ? saved.sortBy : 'newest',
      displayLimitInput: typeof saved.displayLimitInput === 'string' ? saved.displayLimitInput : DEFAULT_DISPLAY_LIMIT
    };
  } catch {
    return { query: '', selectedCategory: '', sortBy: 'newest', displayLimitInput: DEFAULT_DISPLAY_LIMIT };
  }
}

function compareMissingLast(a, b, direction = 1) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return (a - b) * direction;
}

function sortEvents(events, sortBy, userLocation) {
  if (sortBy !== 'newest' && sortBy !== 'oldest' &&
      sortBy !== 'nearest' && sortBy !== 'farthest' &&
      sortBy !== 'magnitude-asc' && sortBy !== 'magnitude-desc') {
    return events;
  }

  const decorated = events.map((event) => ({
    event,
    date: sortBy === 'newest' || sortBy === 'oldest'
      ? getEventDate(event)
      : null,
    distance: sortBy === 'nearest' || sortBy === 'farthest'
      ? getDistance(event, userLocation)
      : null,
    magnitude: sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc'
      ? getMagnitudeInfo(event)
      : null
  }));

  decorated.sort((a, b) => {
    let result = 0;

    if (sortBy === 'newest' || sortBy === 'oldest') {
      result = compareMissingLast(
        a.date,
        b.date,
        sortBy === 'newest' ? -1 : 1
      );
    } else if (sortBy === 'nearest' || sortBy === 'farthest') {
      result = compareMissingLast(
        a.distance,
        b.distance,
        sortBy === 'nearest' ? 1 : -1
      );
    } else {
      if (!a.magnitude && !b.magnitude) {
        result = 0;
      } else if (!a.magnitude) {
        result = 1;
      } else if (!b.magnitude) {
        result = -1;
      } else {
        const unitA = a.magnitude.unit || '';
        const unitB = b.magnitude.unit || '';

        result = unitA !== unitB
          ? unitA.localeCompare(unitB)
          : (a.magnitude.value - b.magnitude.value) *
            (sortBy === 'magnitude-asc' ? 1 : -1);
      }
    }

    return result || String(a.event.title ?? '').localeCompare(String(b.event.title ?? ''));
  });

  return decorated.map(({ event }) => event);
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
  const [initialFilters] = useState(loadEventFilters);
  const [query, setQuery] = useState(initialFilters.query);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.selectedCategory);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [displayLimitInput, setDisplayLimitInput] = useState(initialFilters.displayLimitInput);

  useEffect(() => {
    try {
      localStorage.setItem(EVENT_FILTERS_KEY, JSON.stringify({
        query,
        selectedCategory,
        sortBy,
        displayLimitInput
      }));
    } catch (error) {
      console.error('Failed to save event filters:', error);
    }
  }, [query, selectedCategory, sortBy, displayLimitInput]);

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
      <EventSearchInput query={query} onQueryChange={setQuery} />

      {!isSearchingNearby ? (
        <button
          type="button"
          onClick={onLocateUser}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <MapPinIcon className="h-4 w-4" />
          Find Nearby Events
        </button>
      ) : (
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
            onChange={(event) => setSearchRadius(Number(event.target.value))}
            className="w-full accent-blue-500"
          />

          <p className="text-xs text-gray-400">
            Results update automatically as you adjust the radius.
          </p>

          <button
            type="button"
            onClick={onResetSearch}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Return to Global Events
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
        {filteredEvents.map((event) => (
          <EventListItem
            key={event.id}
            event={event}
            isSelected={String(selectedEvent?.id) === String(event.id)}
            userLocation={userLocation}
            cardRefs={cardRefs}
            onSelectEvent={onSelectEvent}
          />
        ))}

        {filteredEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No events match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
