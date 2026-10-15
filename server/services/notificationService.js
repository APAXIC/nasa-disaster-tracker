
const db = require('../config/db');

/**
 * Create an in-app notification only if this user has not been notified
 * about this event before.
 */
async function notifyUserAboutEvent({
                                      userId,
                                      eventId,
                                      eventTitle,
                                      watchZoneId,
                                      zoneName
                                    }) {
  return db.transaction(async (trx) => {
    const user = await trx('users')
      .select('all_notifications_muted')
      .where({ id: userId })
      .first();

    if (!user || user.all_notifications_muted) {
      return false;
    }

    if (watchZoneId != null) {
      const zone = await trx('watch_zones')
        .select('is_muted')
        .where({
          id: watchZoneId,
          user_id: userId
        })
        .first();

      if (!zone || zone.is_muted) {
        return false;
      }
    }

    const historyRows = await trx('user_event_notification_history')
      .insert({
        user_id: userId,
        event_id: eventId
      })
      .onConflict(['user_id', 'event_id'])
      .ignore()
      .returning(['id']);

    if (historyRows.length === 0) {
      return false;
    }

    await trx('notifications').insert({
      user_id: userId,
      watch_zone_id: watchZoneId ?? null,
      event_id: eventId,
      title: zoneName ? `Disaster Alert: ${zoneName}` : 'Disaster Alert',
      message: `${eventTitle} was detected inside your watch zone.`
    });

    return true;
  });
}

async function notifyZoneAboutActiveEvents(userId, watchZoneId) {
  const zone = await db('watch_zones')
    .select(
      'id',
      'name',
      'radius_km',
      'is_muted',
      db.raw('ST_X(location::geometry) AS longitude'),
      db.raw('ST_Y(location::geometry) AS latitude')
    )
    .where({
      id: watchZoneId,
      user_id: userId
    })
    .first();

  if (!zone || zone.is_muted) {
    return 0;
  }

  const user = await db('users')
    .select('all_notifications_muted')
    .where({ id: userId })
    .first();

  if (!user || user.all_notifications_muted) {
    return 0;
  }

  const events = await db('events')
    .select('id', 'title')
    .whereNull('closed_at')
    .whereRaw(
      `ST_DWithin(
        latest_location,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
        ?
      )`,
      [zone.longitude, zone.latitude, zone.radius_km * 1000]
    );

  let createdCount = 0;

  for (const event of events) {
    const created = await notifyUserAboutEvent({
      userId,
      eventId: event.id,
      eventTitle: event.title,
      watchZoneId: zone.id,
      zoneName: zone.name
    });

    if (created) {
      createdCount += 1;
    }
  }

  return createdCount;
}

module.exports = {
  notifyUserAboutEvent,
  notifyZoneAboutActiveEvents
};
