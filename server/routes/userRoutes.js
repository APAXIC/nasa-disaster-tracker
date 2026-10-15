const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/vapid-public-key', userController.getVapidPublicKey);

router.use(authMiddleware);
router.post('/push-subscription', userController.updatePushSubscription);

module.exports = router;