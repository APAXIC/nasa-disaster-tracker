import { memo, useCallback } from 'react';
import { getCategoryStyle } from './categoryStyle.js';
import CategoryIcon from './CategoryIcon.jsx';
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

  const style = getCategoryStyle(getEventCategories(event)[0]);

  return (
    <button ref={setCardRef} type="button" onClick={handleClick} aria-pressed={isSelected}
      className={`event-card ${isSelected ? 'is-selected' : ''}`}>
      <span className="event-card-icon" style={{ color: style.color, borderColor: `${style.color}55`, background: `${style.color}13` }}
        aria-hidden="true"><CategoryIcon category={getEventCategories(event)[0]} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="block text-sm font-semibold leading-snug text-slate-100">{event.title}</span>
          <span className="event-category-label" style={{ color: style.color, background: `${style.color}20` }}>
            {getEventCategories(event)[0]?.title || 'Event'}
          </span>
        </span>
        {categoryTitles && <span className="mt-1 block text-xs text-slate-400">{categoryTitles}</span>}
        <span className="mt-1 block text-xs text-slate-400">Date: {formatEventDate(eventDate)}</span>
        <span className="mt-1 block text-xs text-amber-300">
          {magnitude ? `Magnitude: ${magnitude.value}${magnitude.unit ? ` ${magnitude.unit}` : ''}` : 'Magnitude: unavailable'}
        </span>
        <span className="mt-1 block text-xs text-sky-400">
          {distance !== null ? `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km from you` : 'Distance unavailable'}
        </span>
      </span>
    </button>
  );
}

export default memo(EventListItem);
