import { memo } from 'react';
import { formatDate } from './historicalEventUtils';

function HistoricalEventCard({ row }) {
  const { event, categories, magnitude, coordinates, distanceKm, date, status } = row;

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-medium leading-snug text-white">
          {event.title || 'Untitled event'}
        </h4>
        <span className="shrink-0 rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
          {status}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500">{formatDate(date)}</p>

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((name) => (
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
            {distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
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
}

export default memo(HistoricalEventCard);
