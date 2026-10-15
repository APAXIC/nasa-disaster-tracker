const axios = require('axios');
const db = require('../config/db');
const { notifyUserAboutEvent } = require('./notificationService');

/**
 * Fetch events from NASA EONET and sync them into Postgres with PostGIS locations.
 * Evaluate active Watch Zones to issue alerts.
 */
async function syncEonetEvents() {
  const eonetUrl =
    process.env.EONET_API_URL ||
    'https://eonet.gsfc.nasa.gov/api/v3/events';

  console.log('[EONET Sync] Fetching events from NASA API...');

  try {
    const response = await axios.get(eonetUrl);

    if (!response.data || !Array.isArray(response.data.events)) {
      throw new Error('NASA EONET returned an invalid events response.');
    }

    const events = response.data.events;
    const incomingIds = [...new Set(
      events
        .map((event) => event.id)
        .filter((id) => typeof id === 'string' && id.length > 0)
    )];

    console.log(`[EONET Sync] Retrieved ${events.length} events from NASA.`);

    let insertedCount = 0;

    for (const event of events) {
      if (!event.id) {
        console.warn('[EONET Sync] Skipping event without an ID.');
        continue;
      }

      const geometry = Array.isArray(event.geometry)
        ? event.geometry
        : [];

      const latestGeo = geometry[geometry.length - 1];
      const coordinates = latestGeo?.coordinates;

      if (!coordinates || coordinates.length < 2) {
        console.warn(
          `[EONET Sync] Skipping insertion for ${event.id}: no usable location.`
        );
        continue;
      }

      const [longitude, latitude] = coordinates;

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        console.warn(
          `[EONET Sync] Skipping insertion for ${event.id}: invalid coordinates.`
        );
        continue;
      }

      const insertedRows = await db('events')
        .insert({
          nasa_id: event.id,
          title: event.title,
          description: event.description || '',
          link: event.link || '',
          closed_at: event.closed ? new Date(event.closed) : null,
          latest_location: db.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography',
            [longitude, latitude]
          ),
          last_synced_at: db.fn.now()
        })
        .onConflict('nasa_id')
        .ignore()
        .returning(['id', 'nasa_id']);

      const insertedEvent = insertedRows[0];

      if (!insertedEvent) {
        continue;
      }

      insertedCount += 1;

      if (Array.isArray(event.categories)) {
        for (const category of event.categories) {
          if (!category.id || !category.title) {
            continue;
          }

          await db('categories')
            .insert({
              id: category.id,
              title: category.title
            })
            .onConflict('id')
            .ignore();

          await db('event_categories')
            .insert({
              event_id: insertedEvent.id,
              category_id: category.id
            })
            .onConflict(['event_id', 'category_id'])
            .ignore();
        }
      }

      for (const point of geometry) {
        const pointCoordinates = point.coordinates;

        if (
          !Array.isArray(pointCoordinates) ||
          pointCoordinates.length < 2
        ) {
          continue;
        }

        const [pointLongitude, pointLatitude] = pointCoordinates;

        if (
          !Number.isFinite(pointLongitude) ||
          !Number.isFinite(pointLatitude) ||
          pointLongitude < -180 ||
          pointLongitude > 180 ||
          pointLatitude < -90 ||
          pointLatitude > 90
        ) {
          continue;
        }

        const recordedAt = point.date
          ? new Date(point.date)
          : new Date();

        if (Number.isNaN(recordedAt.getTime())) {
          continue;
        }

        await db('event_geometries').insert({
          event_id: insertedEvent.id,
          recorded_at: recordedAt,
          location: db.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography',
            [pointLongitude, pointLatitude]
          ),
          magnitude_value: point.magnitudeValue ?? null,
          magnitude_unit: point.magnitudeUnit ?? null
        });
      }

      if (!event.closed) {
        await processWatchZoneAlerts(
          insertedEvent.id,
          event.title,
          longitude,
          latitude
        );
      }
    }

    let closureQuery = db('events')
      .whereNull('closed_at');

    if (incomingIds.length > 0) {
      closureQuery = closureQuery.whereNotIn('nasa_id', incomingIds);
    }

    const closedCount = await closureQuery.update({
      closed_at: db.fn.now()
    });

    console.log(
      `[EONET Sync] Completed. Inserted: ${insertedCount}; marked closed: ${closedCount}.`
    );
  } catch (error) {
    console.error('[EONET Sync Error]:', error.message);
  }
}

/**
 * Evaluate unmuted watch zones overlapping with disaster coordinates
 */
async function processWatchZoneAlerts(
  eventId,
  eventTitle,
  longitude,
  latitude
) {
  try {
    const matchingZones = await db('watch_zones')
      .join('users', 'watch_zones.user_id', 'users.id')
      .select(
        'users.id as user_id',
        'watch_zones.id as watch_zone_id',
        'watch_zones.name as zone_name'
      )
      .where('watch_zones.is_muted', false)
      .where('users.all_notifications_muted', false)
      .whereRaw(
        `ST_DWithin(
          watch_zones.location,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
          watch_zones.radius_km * 1000
        )`,
        [longitude, latitude]
      )
      .orderBy('watch_zones.id', 'asc');

    const notifiedUsers = new Set();

    for (const match of matchingZones) {
      if (notifiedUsers.has(match.user_id)) {
        continue;
      }

      const created = await notifyUserAboutEvent({
        userId: match.user_id,
        eventId,
        eventTitle,
        watchZoneId: match.watch_zone_id,
        zoneName: match.zone_name
      });

      if (created) {
        notifiedUsers.add(match.user_id);
      }
    }
  } catch (error) {
    console.error('[WatchZone Alert Error]:', error.message);
  }
}


module.exports = { syncEonetEvents };