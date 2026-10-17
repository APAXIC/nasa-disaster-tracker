
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchHistoricalCategories,
  fetchHistoricalEvents
} from '../../services/api';

const today = new Date().toISOString().slice(0, 10);

const defaultStart = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
})();

const DEFAULT_ANALYSIS_LIMIT = 10000;
const DEFAULT_DISPLAY_LIMIT = 100;

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getEventDate(event) {
  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    if (geometries[i]?.date) return geometries[i].date;
  }

  return event.closed || null;
}

function getEventTimestamp(event) {
  const date = getEventDate(event);
  if (!date) return null;

  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getEventCategories(event) {
  return (event.categories || [])
    .map((item) => item.title || item.name || item.id)
    .filter(Boolean);
}

function getMagnitudeInfo(event) {
  if (Number.isFinite(event.magnitudeValue)) {
    return {
      value: event.magnitudeValue,
      unit: event.magnitudeUnit || 'unit not provided'
    };
  }

  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    const geometry = geometries[i];

    if (Number.isFinite(geometry?.magnitudeValue)) {
      return {
        value: geometry.magnitudeValue,
        unit: geometry.magnitudeUnit || 'unit not provided'
      };
    }
  }

  return null;
}

function getEventCoordinates(event) {
  const geometries = event.geometry || [];

  for (let i = geometries.length - 1; i >= 0; i -= 1) {
    const coordinates = geometries[i]?.coordinates;
    const points = [];

    function collect(value) {
      if (
        Array.isArray(value) &&
        value.length >= 2 &&
        Number.isFinite(value[0]) &&
        Number.isFinite(value[1])
      ) {
        points.push([value[0], value[1]]);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(collect);
      }
    }

    collect(coordinates);

    if (points.length > 0) {
      const longitude =
        points.reduce((sum, point) => sum + point[0], 0) / points.length;
      const latitude =
        points.reduce((sum, point) => sum + point[1], 0) / points.length;

      return { lat: latitude, lng: longitude };
    }
  }

  return null;
}

function getDistanceKm(origin, destination) {
  if (!origin || !destination) return null;

  const values = [
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  ];

  if (!values.every(Number.isFinite)) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLng / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));

  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(safeA),
    Math.sqrt(1 - safeA)
  );
}

function getEventStatus(event) {
  return event.closed ? 'Closed' : 'Open';
}

function sortHistoricalEvents(events, sortBy, userLocation) {
  const items = [...events];

  if (sortBy === 'oldest' || sortBy === 'newest') {
    return items.sort((a, b) => {
      const dateA = getEventTimestamp(a);
      const dateB = getEventTimestamp(b);

      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      return sortBy === 'oldest'
        ? dateA - dateB
        : dateB - dateA;
    });
  }

  if (sortBy === 'nearest' || sortBy === 'farthest') {
    return items.sort((a, b) => {
      const distanceA = getDistanceKm(
        userLocation,
        getEventCoordinates(a)
      );
      const distanceB = getDistanceKm(
        userLocation,
        getEventCoordinates(b)
      );

      if (distanceA === null && distanceB === null) return 0;
      if (distanceA === null) return 1;
      if (distanceB === null) return -1;

      return sortBy === 'nearest'
        ? distanceA - distanceB
        : distanceB - distanceA;
    });
  }

  if (sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc') {
    const direction = sortBy === 'magnitude-asc' ? 1 : -1;

    return items.sort((a, b) => {
      const magnitudeA = getMagnitudeInfo(a);
      const magnitudeB = getMagnitudeInfo(b);

      if (!magnitudeA && !magnitudeB) return 0;
      if (!magnitudeA) return 1;
      if (!magnitudeB) return -1;

      // Different units are grouped, not compared numerically.
      const unitA = magnitudeA.unit.toLowerCase();
      const unitB = magnitudeB.unit.toLowerCase();

      if (unitA !== unitB) {
        return unitA.localeCompare(unitB);
      }

      return direction * (magnitudeA.value - magnitudeB.value);
    });
  }

  return items;
}

export default function StatisticsPanel({ userLocation }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(today);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');

  const [analysisLimit, setAnalysisLimit] = useState(
    String(DEFAULT_ANALYSIS_LIMIT)
  );
  const [displayLimit, setDisplayLimit] = useState(
    String(DEFAULT_DISPLAY_LIMIT)
  );
  const [sortBy, setSortBy] = useState('newest');

  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetchHistoricalCategories();
        const items = Array.isArray(response)
          ? response
          : response.data || response.categories || [];

        if (!cancelled) {
          setCategories(items);
        }
      } catch {
        if (!cancelled) {
          setCategoriesError(
            'Could not load categories. You can still search without a category filter.'
          );
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

  const search = useCallback(async (event) => {
    event?.preventDefault();

    if (!start || !end) {
      setError('Please select both dates.');
      return;
    }

    if (start > end) {
      setError('The start date must be before or equal to the end date.');
      return;
    }

    // Empty fields fall back to their default limits.
    const parsedAnalysisLimit = analysisLimit.trim() === ''
      ? DEFAULT_ANALYSIS_LIMIT
      : Number(analysisLimit);

    const parsedDisplayLimit = displayLimit.trim() === ''
      ? DEFAULT_DISPLAY_LIMIT
      : Number(displayLimit);

    if (
      !Number.isInteger(parsedAnalysisLimit) ||
      parsedAnalysisLimit < 1 ||
      parsedAnalysisLimit > DEFAULT_ANALYSIS_LIMIT
    ) {
      setError('Analysis limit must be an integer between 1 and 10000.');
      return;
    }

    if (
      !Number.isInteger(parsedDisplayLimit) ||
      parsedDisplayLimit < 1 ||
      parsedDisplayLimit > DEFAULT_DISPLAY_LIMIT
    ) {
      setError('Display limit must be an integer between 1 and 100.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchHistoricalEvents({
        start,
        end,
        category,
        status,
        limit: parsedAnalysisLimit
      });

      const items = Array.isArray(response)
        ? response
        : response.data || response.events || [];

      setEvents(items);
      setResultCount(
        typeof response.totalFetched === 'number'
          ? response.totalFetched
          : items.length
      );
      setTruncated(Boolean(response.truncated));
      setHasSearched(true);
    } catch (err) {
      setEvents([]);
      setResultCount(0);
      setTruncated(false);
      setHasSearched(false);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to retrieve historical events. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [start, end, category, status, analysisLimit, displayLimit]);

  const categoryStats = useMemo(() => {
    const counts = new Map();

    for (const event of events) {
      const names = getEventCategories(event);

      if (names.length === 0) {
        counts.set('Uncategorized', (counts.get('Uncategorized') || 0) + 1);
        continue;
      }

      for (const name of names) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [events]);

  const maxCategoryCount = Math.max(
    1,
    ...categoryStats.map((item) => item.count)
  );

  const sortedEvents = useMemo(
    () => sortHistoricalEvents(events, sortBy, userLocation),
    [events, sortBy, userLocation]
  );

  const parsedDisplayLimit = displayLimit.trim() === ''
    ? DEFAULT_DISPLAY_LIMIT
    : Number(displayLimit);

  const safeDisplayLimit =
    Number.isInteger(parsedDisplayLimit) &&
    parsedDisplayLimit >= 1 &&
    parsedDisplayLimit <= DEFAULT_DISPLAY_LIMIT
      ? parsedDisplayLimit
      : DEFAULT_DISPLAY_LIMIT;

  const displayedEvents = sortedEvents.slice(0, safeDisplayLimit);

  return (
    <section className="space-y-5 text-sm text-gray-200">
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500">
          NASA EONET
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Statistics & History
        </h2>
        <p className="mt-1 text-gray-400">
          Explore natural events across a selected period.
        </p>
      </div>

      <form
        onSubmit={search}
        className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-400">From</span>
            <input
              type="date"
              value={start}
              max={end || today}
              onChange={(event) => setStart(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2 py-2 text-xs text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-gray-400">To</span>
            <input
              type="date"
              value={end}
              min={start}
              max={today}
              onChange={(event) => setEnd(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2 py-2 text-xs text-white"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={categoriesLoading}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option
                key={item.id || item.title}
                value={item.id || item.title}
              >
                {item.title || item.name || item.id}
              </option>
            ))}
          </select>
          {categoriesError && (
            <span className="mt-1 block text-xs text-amber-300">
              {categoriesError}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Event status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="all">All events</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">
            Events for analysis (1–10,000)
          </span>
          <input
            type="number"
            min="1"
            max="10000"
            step="1"
            value={analysisLimit}
            onChange={(event) => setAnalysisLimit(event.target.value)}
            placeholder="10000"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Leave empty to use 10,000.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">
            Events to display (1–100)
          </span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={displayLimit}
            onChange={(event) => setDisplayLimit(event.target.value)}
            placeholder="100"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Leave empty to display up to 100.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-gray-400">Sort events</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="magnitude-desc">
              Magnitude: high to low (grouped by unit)
            </option>
            <option value="magnitude-asc">
              Magnitude: low to high (grouped by unit)
            </option>
            {userLocation && (
              <>
                <option value="nearest">Nearest to me</option>
                <option value="farthest">Farthest from me</option>
              </>
            )}
          </select>
          {(sortBy === 'magnitude-asc' || sortBy === 'magnitude-desc') && (
            <span className="mt-1 block text-xs text-gray-500">
              Values with different units are grouped separately, not compared as one scale.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-white transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? 'Loading events...' : 'Apply filters'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <p className="text-xs text-gray-400">Events analyzed</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {resultCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <p className="text-xs text-gray-400">Categories found</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {categoryStats.length}
          </p>
        </div>
      </div>

      {truncated && (
        <p className="text-xs text-amber-300">
          The result set reached the requested analysis limit. More events may exist outside this result set.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
        <h3 className="font-semibold text-white">Events by category</h3>

        {!hasSearched ? (
          <p className="mt-3 text-gray-500">
            Set your filters and select Apply filters to generate statistics.
          </p>
        ) : categoryStats.length === 0 ? (
          <p className="mt-3 text-gray-500">
            {loading
              ? 'Calculating statistics...'
              : 'No category data available for this search.'}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {categoryStats.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="truncate text-gray-300">{item.name}</span>
                  <span className="tabular-nums text-gray-400">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{
                      width: `${(item.count / maxCategoryCount) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-white">Historical events</h3>
          <span className="text-right text-xs text-gray-500">
            {hasSearched
              ? `Showing ${displayedEvents.length} of ${events.length} fetched`
              : 'Not searched yet'}
          </span>
        </div>

        {!hasSearched ? (
          <div className="rounded-xl border border-dashed border-gray-800 p-5 text-center text-gray-500">
            Apply filters to load historical events.
          </div>
        ) : displayedEvents.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-gray-800 p-5 text-center text-gray-500">
            No events found for these filters.
          </div>
        ) : (
          <div className="space-y-3">
            {displayedEvents.map((event) => {
              const eventCategories = getEventCategories(event);
              const magnitude = getMagnitudeInfo(event);
              const coordinates = getEventCoordinates(event);
              const distanceKm = getDistanceKm(userLocation, coordinates);

              return (
                <article
                  key={event.id || event.nasa_id || event.link || event.title}
                  className="rounded-xl border border-gray-800 bg-gray-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-medium leading-snug text-white">
                      {event.title || 'Untitled event'}
                    </h4>
                    <span className="shrink-0 rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
                      {getEventStatus(event)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {formatDate(getEventDate(event))}
                  </p>

                  {eventCategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {eventCategories.map((name) => (
                        <span
                          key={name}
                          className="rounded-md bg-sky-950/70 px-2 py-1 text-xs text-sky-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {magnitude && (
                    <p className="mt-3 text-xs text-gray-400">
                      Magnitude:{' '}
                      <span className="text-gray-200">
                        {magnitude.value} {magnitude.unit}
                      </span>
                    </p>
                  )}

                  {coordinates && (
                    <p className="mt-2 text-xs text-gray-400">
                      Coordinates:{' '}
                      <span className="text-gray-200">
                        {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                      </span>
                    </p>
                  )}

                  {distanceKm !== null && (
                    <p className="mt-2 text-xs text-gray-400">
                      Distance from you:{' '}
                      <span className="text-gray-200">
                        {distanceKm.toLocaleString(undefined, {
                          maximumFractionDigits: 1
                        })} km
                      </span>
                    </p>
                  )}

                  {event.description && (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-400">
                      {event.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
