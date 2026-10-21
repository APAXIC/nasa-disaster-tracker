const db = require('../config/db');
const { findEventsInRadius } = require('../services/eventService');
const eventSelect = require('../queries/eventSelect');

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
