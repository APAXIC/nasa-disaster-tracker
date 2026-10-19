const db = require('../config/db');
const { findEventsInRadius } = require('../services/eventService');

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
 * Fetch all active disaster events with categories and geometry metadata.
 */
exports.getAllEvents = async (req, res) => {
  try {
    const events = await db('events as e')
      .select(eventSelect)
      .whereNull('e.closed_at')
      .orderByRaw('"event_date" DESC NULLS LAST')
      .orderBy('e.last_synced_at', 'desc');

    res.json({
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('[Events] Failed to fetch active events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * Fetch active events within a radius of the supplied coordinates.
 */
exports.getNearbyEvents = async (req, res) => {
  const { lat, lng, radius = 100 } = req.query;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({
      error: 'Latitude (lat) and longitude (lng) are required'
    });
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const radiusKm = Number(radius);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      error: 'Valid latitude and longitude are required'
    });
  }

  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 20000) {
    return res.status(400).json({
      error: 'Radius must be greater than 0 and no more than 20000 km'
    });
  }

  try {
    const nearbyEvents = await findEventsInRadius(
      latitude,
      longitude,
      radiusKm
    );

    res.json({
      query: {
        latitude,
        longitude,
        radiusKm
      },
      count: nearbyEvents.length,
      data: nearbyEvents
    });
  } catch (error) {
    console.error('[Events] Nearby search failed:', error);
    res.status(500).json({ error: 'Spatial query failed' });
  }
};
