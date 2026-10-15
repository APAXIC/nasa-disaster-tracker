const db = require('../config/db');
const { findEventsInRadius } = require('../services/eventService');

/**
 * Create a new watch zone
 */
exports.createWatchZone = async (req, res) => {
  const { name, latitude, longitude, radiusKm } = req.body;
  const userId = req.user.userId;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    latitude == null ||
    longitude == null ||
    radiusKm == null
  ) {
    return res.status(400).json({ error: 'Name, latitude, longitude, and radiusKm are required' });
  }

  try {
    const [zone] = await db('watch_zones')
      .insert({
        user_id: userId,
        name,
        radius_km: radiusKm,
        location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [longitude, latitude])
      })
      .returning(['id', 'name', 'radius_km', 'created_at']);

    res.status(201).json({ message: 'Watch zone created successfully', zone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create watch zone' });
  }
};

/**
 * Fetch all watch zones with active disasters
 */
exports.getUserWatchZones = async (req, res) => {
  const userId = req.user.userId;

  try {
    const zones = await db('watch_zones')
      .select(
        'id',
        'name',
        'radius_km',
        db.raw('ST_Y(location::geometry) as latitude'),
        db.raw('ST_X(location::geometry) as longitude')
      )
      .where({ user_id: userId });

    const zonesWithEvents = await Promise.all(
      zones.map(async (zone) => {
        const eventsInZone = await findEventsInRadius(zone.latitude, zone.longitude, zone.radius_km);

        return {
          ...zone,
          active_disasters_count: eventsInZone.length,
          disasters: eventsInZone
        };
      })
    );

    res.json({ data: zonesWithEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watch zones' });
  }
};

/**
 * Fetch a single watch zone by ID
 */
exports.getWatchZoneById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const zone = await db('watch_zones')
      .select(
        'id',
        'name',
        'radius_km',
        db.raw('ST_Y(location::geometry) as latitude'),
        db.raw('ST_X(location::geometry) as longitude')
      )
      .where({ id, user_id: userId })
      .first();

    if (!zone) {
      return res.status(404).json({ error: 'Watch zone not found' });
    }

    const disasters = await findEventsInRadius(zone.latitude, zone.longitude, zone.radius_km);

    res.json({
      data: {
        ...zone,
        active_disasters_count: disasters.length,
        disasters
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watch zone' });
  }
};

/**
 * Update an existing watch zone
 */
exports.updateWatchZone = async (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude, radiusKm } = req.body;
  const userId = req.user.userId;

  try {
    const zone = await db('watch_zones').where({ id, user_id: userId }).first();
    if (!zone) {
      return res.status(404).json({ error: 'Watch zone not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (radiusKm) updateData.radius_km = radiusKm;

    if (latitude != null && longitude != null) {
      updateData.location = db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [
        longitude,
        latitude
      ]);
    }

    await db('watch_zones').where({ id, user_id: userId }).update(updateData);

    res.json({ message: 'Watch zone updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update watch zone' });
  }
};

/**
 * Delete a watch zone
 */
exports.deleteWatchZone = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const deletedCount = await db('watch_zones').where({ id, user_id: userId }).del();

    if (!deletedCount) {
      return res.status(404).json({ error: 'Watch zone not found' });
    }

    res.json({ message: 'Watch zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete watch zone' });
  }
};