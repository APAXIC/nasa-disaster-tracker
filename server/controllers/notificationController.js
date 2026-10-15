
const db = require('../config/db');

function applyNotificationFilters(query, userId, filters = {}) {
  query.where('notifications.user_id', userId);

  if (filters.watchZoneId !== undefined) {
    query.where('notifications.watch_zone_id', filters.watchZoneId);
  }

  if (filters.unassigned) {
    query.whereNull('notifications.watch_zone_id');
  }

  if (filters.unreadOnly) {
    query.where('notifications.is_read', false);
  }

  return query;
}

/**
 * Fetch notifications with optional zone and unread filters.
 */
exports.getNotifications = async (req, res) => {
  const userId = req.user.userId;
  const { watchZoneId, unassigned, unreadOnly } = req.query;

  if (watchZoneId !== undefined && unassigned === 'true') {
    return res.status(400).json({
      error: 'Use either watchZoneId or unassigned, not both.'
    });
  }

  if (
    watchZoneId !== undefined &&
    (!/^\d+$/.test(watchZoneId) || Number(watchZoneId) < 1)
  ) {
    return res.status(400).json({
      error: 'watchZoneId must be a positive integer.'
    });
  }

  if (
    [unassigned, unreadOnly].some(
      (value) => value !== undefined && !['true', 'false'].includes(value)
    )
  ) {
    return res.status(400).json({
      error: 'unassigned and unreadOnly must be true or false.'
    });
  }

  const filters = {
    watchZoneId:
      watchZoneId !== undefined ? Number(watchZoneId) : undefined,
    unassigned: unassigned === 'true',
    unreadOnly: unreadOnly === 'true'
  };

  try {
    const query = db('notifications')
      .leftJoin(
        'watch_zones',
        'notifications.watch_zone_id',
        'watch_zones.id'
      )
      .leftJoin('events', 'notifications.event_id', 'events.id')
      .select(
        'notifications.id',
        'notifications.title',
        'notifications.message',
        'notifications.is_read',
        'notifications.created_at',
        'notifications.event_id',
        'notifications.watch_zone_id',
        'watch_zones.name as watch_zone_name',
        'events.nasa_id',
        'events.link as event_link'
      )
      .orderBy('notifications.created_at', 'desc');

    applyNotificationFilters(query, userId, filters);

    const notifications = await query;

    const countQuery = db('notifications')
      .count('* as count');

    applyNotificationFilters(countQuery, userId, filters);

    const unreadCount = await countQuery.first();

    res.json({
      data: notifications,
      unreadCount: Number(unreadCount.count)
    });
  } catch (error) {
    console.error('[Get Notifications Error]:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

/**
 * Mark one notification as read.
 */
exports.markNotificationAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const updatedCount = await db('notifications')
      .where({ id, user_id: userId })
      .update({ is_read: true });

    if (!updatedCount) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('[Mark Notification Read Error]:', error);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

/**
 * Mark all notifications as read.
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.userId;

  try {
    await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[Mark All Notifications Read Error]:', error);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
};

/**
 * Delete one notification without deleting its delivery history.
 */
exports.deleteNotification = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const deletedCount = await db('notifications')
      .where({ id, user_id: userId })
      .del();

    if (!deletedCount) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('[Delete Notification Error]:', error);
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
};

/**
 * Delete all visible notifications for the authenticated user.
 */
exports.deleteAllNotifications = async (req, res) => {
  const userId = req.user.userId;

  try {
    const deletedCount = await db('notifications')
      .where({ user_id: userId })
      .del();

    res.json({
      message: 'All notifications deleted.',
      deletedCount
    });
  } catch (error) {
    console.error('[Delete All Notifications Error]:', error);
    res.status(500).json({ error: 'Failed to delete notifications.' });
  }
};
