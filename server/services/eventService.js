const db = require('../config/db');
const eventSelect = require('../queries/eventSelect');

/**
 * Fetch active or historical disaster events within a radius of a center point.
 */
exports.findEventsInRadius = async (
  latitude,
  longitude,
  radiusKm,
  activeOnly = true
) => {
  const radiusMeters = Number(radiusKm) * 1000;

  let query = db('events as e')
    .select(eventSelect)
    .select(
      db.raw(`
        ST_Distance(
          e.latest_location,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
        ) / 1000 AS distance_km
      `, [longitude, latitude])
    )
    .whereRaw(
      `ST_DWithin(
        e.latest_location,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
        ?
      )`,
      [longitude, latitude, radiusMeters]
    );

  if (activeOnly) {
    query = query.whereNull('e.closed_at');
  }

  return query
    .orderBy('distance_km', 'asc')
    .orderByRaw('"event_date" DESC NULLS LAST');
};
