import { memo } from 'react';
import { getCategoryStyle } from '../events/categoryStyle.js';
import CategoryIcon from '../events/CategoryIcon.jsx';
import { formatDate } from './historicalEventUtils.js';

function HistoricalEventCard({ row }) {
  const { event, categories, magnitude, coordinates, distanceKm, date, status } = row;
  const mainCategory = categories[0] || 'Other';
  const categoryStyle = getCategoryStyle(mainCategory);

  return (
    <article className="statistics-event-card">
      <span className="statistics-event-icon" style={{ '--category-color': categoryStyle.color }} aria-hidden="true">
        <CategoryIcon category={mainCategory} />
      </span>
      <div className="statistics-event-content">
        <div className="statistics-event-heading">
          <h4>{event.title || 'Untitled event'}</h4>
          <span className="statistics-event-badge">{mainCategory}</span>
        </div>
        <p className="statistics-event-muted">{categories.join(', ') || 'Uncategorized'} · {status}</p>
        <p className="statistics-event-muted">Date: {formatDate(date)}</p>
        <p className="statistics-event-magnitude">{magnitude
          ? `Magnitude: ${magnitude.value}${magnitude.unit ? ` ${magnitude.unit}` : ''}`
          : 'Magnitude: unavailable'}</p>
        {distanceKm !== null && <p className="statistics-event-distance">
          {distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km from you
        </p>}
        {coordinates && <p className="statistics-event-muted">
          {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </p>}
        {event.description && <p className="statistics-event-description">{event.description}</p>}
      </div>
    </article>
  );
}

export default memo(HistoricalEventCard);
