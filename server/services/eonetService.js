const axios = require('axios');
const webpush = require('web-push');
const db = require('../config/db');

// Configure Web Push VAPID keys if set in environment
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@disaster-tracker.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Fetch events from NASA EONET v3 and sync them into PostgreSQL with PostGIS locations.
 * Evaluates active Watch Zones to issue in-app and Web Push alerts.
 */
async function syncEonetEvents() {
  const eonetUrl = process.env.EONET_API_URL || 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';
  console.log('[EONET Sync] Fetching events from NASA API...');

  try {
    const response = await axios.get(eonetUrl);
    const events = response.data.events || [];

    console.log(`[EONET Sync] Retrieved ${events.length} open events from NASA.`);

    for (const event of events) {
      if (!event.geometry || event.geometry.length === 0) continue;

      const latestGeo = event.geometry[event.geometry.length - 1];
      const coordinates = latestGeo.coordinates;

      if (!coordinates || coordinates.length < 2) continue;

      const [longitude, latitude] = coordinates;
      const closedAt = event.closed ? new Date(event.closed) : null;

      // 1. Upsert Main Event Record
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
          description: event.description || '',
          closed_at: closedAt,
          latest_location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography', [longitude, latitude]),
          last_synced_at: db.fn.now()
        })
        .returning(['id', 'nasa_id', 'created_at', 'updated_at']);

      const isNewEvent = insertedEvent.created_at?.getTime() === insertedEvent.updated_at?.getTime();

      // 2. Upsert Categories & Junction Entries
      if (event.categories && event.categories.length > 0) {
        for (const cat of event.categories) {
          await db('categories')
            .insert({ id: cat.id, title: cat.title })
            .onConflict('id')
            .ignore();

          await db('event_categories')
            .insert({ event_id: insertedEvent.id, category_id: cat.id })
            .onConflict(['event_id', 'category_id'])
            .ignore();
        }
      }

      // 3. Store Historical Trajectory Points (Wipe & Re-insert to prevent duplicates cleanly)
      await db('event_geometries').where({ event_id: insertedEvent.id }).del();

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

      // 4. Trigger Alerts for Active Watch Zones
      if (isNewEvent && !closedAt) {
        await processWatchZoneAlerts(insertedEvent.id, event.title, longitude, latitude);
      }
    }

    console.log('[EONET Sync] Sync completed successfully.');
  } catch (error) {
    console.error('[EONET Sync Error]:', error.message);
  }
}

/**
 * PostGIS Spatial Matcher: Evaluates unmuted watch zones overlapping with disaster coordinates
 */
async function processWatchZoneAlerts(eventId, eventTitle, longitude, latitude) {
  try {
    const matchingZones = await db('watch_zones')
      .join('users', 'watch_zones.user_id', 'users.id')
      .select(
        'users.id as user_id',
        'users.push_subscription',
        'watch_zones.id as watch_zone_id',
        'watch_zones.name as zone_name'
      )
      .where('watch_zones.is_muted', false)
      .where('users.all_notifications_muted', false)
      .whereRaw(
        'ST_DWithin(watch_zones.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, watch_zones.radius_km * 1000)',
        [longitude, latitude]
      );

    for (const match of matchingZones) {
      // Insert in-app notification record
      await db('notifications').insert({
        user_id: match.user_id,
        watch_zone_id: match.watch_zone_id,
        event_id: eventId,
        title: `Disaster Alert: ${match.zone_name}`,
        message: `${eventTitle} was detected inside your watch zone.`
      });

      // Send Web Push Notification if browser subscription exists
      if (match.push_subscription && process.env.VAPID_PUBLIC_KEY) {
        const payload = JSON.stringify({
          title: `⚠️ Alert: ${match.zone_name}`,
          body: `${eventTitle} detected within radius!`,
          eventId
        });

        webpush.sendNotification(match.push_subscription, payload).catch((err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            db('users').where({ id: match.user_id }).update({ push_subscription: null });
          }
        });
      }
    }
  } catch (error) {
    console.error('[WatchZone Alert Error]:', error.message);
  }
}

module.exports = { syncEonetEvents };