
const db = require('../config/db');

const eventSelect = [
  'e.id',
  'e.nasa_id',
  'e.title',
  'e.description',
  'e.link',
  'e.closed_at',
  'e.last_synced_at',
  'e.country_code',
  'e.country_name',
  db.raw('ST_Y(e.latest_location::geometry) AS latitude'),
  db.raw('ST_X(e.latest_location::geometry) AS longitude'),

  db.raw(`
    COALESCE((
      SELECT json_agg(
        json_build_object('id', c.id, 'title', c.title)
        ORDER BY c.title
      )
      FROM event_categories ec
      JOIN categories c ON c.id = ec.category_id
      WHERE ec.event_id = e.id
    ), '[]'::json) AS categories
  `),

  db.raw(`
    (
      SELECT MIN(eg.recorded_at)
      FROM event_geometries eg
      WHERE eg.event_id = e.id
    ) AS event_date
  `),

  db.raw(`
    (
      SELECT eg.magnitude_value
      FROM event_geometries eg
      WHERE eg.event_id = e.id
        AND eg.magnitude_value IS NOT NULL
      ORDER BY eg.recorded_at DESC, eg.id DESC
      LIMIT 1
    ) AS magnitude_value
  `),

  db.raw(`
    (
      SELECT eg.magnitude_unit
      FROM event_geometries eg
      WHERE eg.event_id = e.id
        AND eg.magnitude_value IS NOT NULL
      ORDER BY eg.recorded_at DESC, eg.id DESC
      LIMIT 1
    ) AS magnitude_unit
  `),

  db.raw(`
    (
      SELECT MAX(eg.recorded_at)
      FROM event_geometries eg
      WHERE eg.event_id = e.id
    ) AS latest_geometry_at
  `),

  db.raw(`
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'date', eg.recorded_at,
          'coordinates', json_build_array(
            ST_X(eg.location::geometry),
            ST_Y(eg.location::geometry)
          ),
          'magnitudeValue', eg.magnitude_value,
          'magnitudeUnit', eg.magnitude_unit
        )
        ORDER BY eg.recorded_at
      )
      FROM event_geometries eg
      WHERE eg.event_id = e.id
    ), '[]'::json) AS geometry
  `)
];

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
