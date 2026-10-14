const db = require('../config/db');

/**
 * Fetch active or historical disaster events within a radius of a center point.
 */
exports.findEventsInRadius = async (latitude, longitude, radiusKm, activeOnly = true) => {
  const radiusMeters = parseFloat(radiusKm) * 1000;

  let query = db('events')
    .select(
      'id',
      'title',
      'description',
      db.raw('ST_Y(latest_location::geometry) as latitude'),
      db.raw('ST_X(latest_location::geometry) as longitude'),
      db.raw(
        'ST_Distance(latest_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) / 1000 as distance_km',
        [longitude, latitude]
      )
    )
    .whereRaw(
      'ST_DWithin(latest_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
      [longitude, latitude, radiusMeters]
    );

  if (activeOnly) {
    query = query.whereNull('closed_at');
  }

  return await query.orderBy('distance_km', 'asc');
};