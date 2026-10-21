import HistoricalEventCard from './HistoricalEventCard.jsx';

export default function HistoricalEventsSection({ hasSearched, displayedEvents, events, loading, displayedEventRows }) {
  return (
    <section className="statistics-history-section">
      <div className="statistics-section-heading">
        <h3>Historical events</h3>
        <span>{hasSearched ? `Showing ${displayedEvents.length} of ${events.length} fetched` : 'Not searched yet'}</span>
      </div>
      {!hasSearched ? (
        <div className="statistics-empty">Apply filters to load historical events.</div>
      ) : displayedEvents.length === 0 && !loading ? (
        <div className="statistics-empty">No events found for these filters.</div>
      ) : (
        <div className="statistics-event-list">
          {displayedEventRows.map((row) => <HistoricalEventCard
            key={row.event.id || row.event.nasa_id || row.event.link || row.event.title}
            row={row}
          />)}
        </div>
      )}
    </section>
  );
}
