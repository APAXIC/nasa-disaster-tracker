import HistoricalEventCard from './HistoricalEventCard.jsx';

export default function HistoricalEventsSection({ hasSearched, displayedEvents, events, loading, displayedEventRows }) {
  return (
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
            {displayedEventRows.map((row) => (
              <HistoricalEventCard
                key={row.event.id || row.event.nasa_id || row.event.link || row.event.title}
                row={row}
              />
            ))}
          </div>
        )}
      </div>
  );
}
