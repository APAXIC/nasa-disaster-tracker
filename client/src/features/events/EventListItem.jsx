import { memo, useCallback } from 'react';
import {
  formatEventDate,
  getDistance,
  getEventCategories,
  getEventDate,
  getMagnitudeInfo
} from './eventUtils';

function EventListItem({ event, isSelected, userLocation, cardRefs, onSelectEvent }) {
  const setCardRef = useCallback((element) => {
    const id = String(event.id);

    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, [cardRefs, event.id]);

  const handleClick = useCallback(() => {
    onSelectEvent(event);
  }, [event, onSelectEvent]);

  const magnitude = getMagnitudeInfo(event);
  const distance = getDistance(event, userLocation);
  const eventDate = getEventDate(event);
  const categoryTitles = getEventCategories(event)
    .map((category) => category.title)
    .join(', ');

  return (
    <button
      ref={setCardRef}
      type="button"
      onClick={handleClick}
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
}

export default memo(EventListItem);
