const db = require('../config/db');
const { findEventsInRadius } = require('../services/eventService');

/**
 * Fetch all active disaster events
 */
exports.getAllEvents = async (req, res) => {
  try {
    const events = await db('events')
      .select(
        'id',
        'nasa_id',
        'title',
        'description',
        'link',
        'closed_at',
        'last_synced_at',
        db.raw('ST_Y(latest_location::geometry) as latitude'),
        db.raw('ST_X(latest_location::geometry) as longitude')
      )
      .whereNull('closed_at')
      .orderBy('last_synced_at', 'desc');

    res.json({ count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * Perform spatial query to find events within a radius of given coordinates
 */
exports.getNearbyEvents = async (req, res) => {
  const { lat, lng, radius = 100 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude (lat) and Longitude (lng) are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  try {
    const nearbyEvents = await findEventsInRadius(latitude, longitude, radius);

    res.json({
      query: { latitude, longitude, radiusKm: parseFloat(radius) },
      count: nearbyEvents.length,
      data: nearbyEvents
    });
  } catch (error) {
    res.status(500).json({ error: 'Spatial query failed' });
  }
};