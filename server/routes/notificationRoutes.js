const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);

router.patch('/read-all', notificationController.markAllNotificationsAsRead);
router.patch('/:id/read', notificationController.markNotificationAsRead);

router.delete('/', notificationController.deleteAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;