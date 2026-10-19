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

    const incomingIds = [
      ...new Set(
        events
          .map((event) => event.id)
          .filter((id) => typeof id === 'string' && id.length > 0)
      )
    ];

    console.log(`[EONET Sync] Retrieved ${events.length} events from NASA.`);

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      if (!event.id) {
        console.warn('[EONET Sync] Skipping event without an ID.');
        skippedCount += 1;
        continue;
      }

      const geometry = Array.isArray(event.geometry)
        ? event.geometry
        : [];

      const validPoints = geometry.filter((point) => {
        const coordinates = point?.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          return false;
        }

        const [longitude, latitude] = coordinates;

        return (
          Number.isFinite(longitude) &&
          Number.isFinite(latitude) &&
          longitude >= -180 &&
          longitude <= 180 &&
          latitude >= -90 &&
          latitude <= 90
        );
      });

      if (validPoints.length === 0) {
        console.warn(
          `[EONET Sync] Skipping ${event.id}: no usable location.`
        );
        skippedCount += 1;
        continue;
      }

      const latestPoint = validPoints[validPoints.length - 1];
      const [longitude, latitude] = latestPoint.coordinates;

      const syncResult = await db.transaction(async (trx) => {
        const existingEvent = await trx('events')
          .where({ nasa_id: event.id })
          .first('id');

        let eventId;

        const eventData = {
          title: event.title || 'Untitled event',
          description: event.description || '',
          link: event.link || '',
          closed_at: event.closed ? new Date(event.closed) : null,
          latest_location: trx.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography',
            [longitude, latitude]
          ),
          last_synced_at: trx.fn.now()
        };

        if (existingEvent) {
          eventId = existingEvent.id;

          await trx('events')
            .where({ id: eventId })
            .update(eventData);
        } else {
          const [insertedEvent] = await trx('events')
            .insert({
              nasa_id: event.id,
              ...eventData
            })
            .returning(['id']);

          eventId = insertedEvent.id;
        }

        const categories = Array.isArray(event.categories)
          ? event.categories
          : [];

        const validCategories = categories.filter(
          (category) =>
            category &&
            typeof category.id === 'string' &&
            category.id.length > 0 &&
            typeof category.title === 'string' &&
            category.title.length > 0
        );

        for (const category of validCategories) {
          await trx('categories')
            .insert({
              id: category.id,
              title: category.title
            })
            .onConflict('id')
            .merge({ title: category.title });
        }

        await trx('event_categories')
          .where({ event_id: eventId })
          .del();

        if (validCategories.length > 0) {
          await trx('event_categories').insert(
            validCategories.map((category) => ({
              event_id: eventId,
              category_id: category.id
            }))
          );
        }

        await trx('event_geometries')
          .where({ event_id: eventId })
          .del();

        const geometryRows = [];

        for (const point of validPoints) {
          const [pointLongitude, pointLatitude] = point.coordinates;

          const recordedAt = point.date
            ? new Date(point.date)
            : new Date();

          if (Number.isNaN(recordedAt.getTime())) {
            continue;
          }

          geometryRows.push({
            event_id: eventId,
            recorded_at: recordedAt,
            location: trx.raw(
              'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography',
              [pointLongitude, pointLatitude]
            ),
            magnitude_value:
              Number.isFinite(point.magnitudeValue)
                ? point.magnitudeValue
                : null,
            magnitude_unit:
              typeof point.magnitudeUnit === 'string'
                ? point.magnitudeUnit
                : null
          });
        }

        if (geometryRows.length > 0) {
          await trx('event_geometries').insert(geometryRows);
        }

        return {
          eventId,
          wasInserted: !existingEvent
        };
      });

      if (syncResult.wasInserted) {
        insertedCount += 1;
      } else {
        updatedCount += 1;
      }

      if (syncResult.wasInserted && !event.closed) {
        await processWatchZoneAlerts(
          syncResult.eventId,
          event.title || 'Untitled event',
          longitude,
          latitude
        );
      }
    }

    if (incomingIds.length > 0) {
      const closedCount = await db('events')
        .whereNull('closed_at')
        .whereNotIn('nasa_id', incomingIds)
        .update({ closed_at: db.fn.now() });

      console.log(
        `[EONET Sync] Marked closed: ${closedCount}.`
      );
    } else {
      console.warn(
        '[EONET Sync] No event IDs received; skipping automatic closure.'
      );
    }

    console.log(
      `[EONET Sync] Completed. Inserted: ${insertedCount}; ` +
      `updated: ${updatedCount}; skipped: ${skippedCount}.`
    );
  } catch (error) {
    console.error('[EONET Sync Error]:', error);
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