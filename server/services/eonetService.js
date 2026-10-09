const axios = require('axios');
const db = require('../config/db');

const EONET_API_URL = process.env.EONET_API_URL || 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';

/**
 * Fetch events from NASA EONET v3 and syncs them into PostgreSQL with PostGIS locations.
 */
async function syncEonetEvents() {
  console.log('[EONET Sync] Fetching events from NASA API...');
  try {
    const response = await axios.get(EONET_API_URL);
    const events = response.data.events || [];

    console.log(`[EONET Sync] Retrieved ${events.length} open events from NASA.`);

    for (const event of events) {
      if (!event.geometry || event.geometry.length === 0) continue;

      const latestGeo = event.geometry[event.geometry.length - 1];
      const coordinates = latestGeo.coordinates;

      if (!coordinates || coordinates.length < 2) continue;

      const [longitude, latitude] = coordinates;
      const closedAt = event.closed ? new Date(event.closed) : null;

      const [insertedEvent] = await db('events')
        .insert({
          nasa_id: event.id,
          title: event.title,
          description: event.description || '',
          link: event.link || '',
          closed_at: closedAt,
          latest_location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [longitude, latitude]),
          last_synced_at: db.fn.now()
        })
        .onConflict('nasa_id')
        .merge({
          title: event.title,
          closed_at: closedAt,
          latest_location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [longitude, latitude]),
          last_synced_at: db.fn.now()
        })
        .returning(['id', 'nasa_id']);

      for (const geoPoint of event.geometry) {
        if (!geoPoint.coordinates || geoPoint.coordinates.length < 2) continue;

        const [pLng, pLat] = geoPoint.coordinates;
        const recordedAt = new Date(geoPoint.date);
        const magVal = geoPoint.magnitudeValue || null;
        const magUnit = geoPoint.magnitudeUnit || null;

        await db('event_geometries').insert({
          event_id: insertedEvent.id,
          recorded_at: recordedAt,
          location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [pLng, pLat]),
          magnitude_value: magVal,
          magnitude_unit: magUnit
        });
      }
    }

    console.log('[EONET Sync] Sync completed successfully.');
  } catch (error) {
    console.error('[EONET Sync Error]:', error.message);
  }
}

module.exports = { syncEonetEvents };