
const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const historicalEventController = require('../controllers/historicalEventController');

router.get('/historical/categories', historicalEventController.getHistoricalCategories);
router.get('/historical', historicalEventController.getHistoricalEvents);

router.get('/', eventController.getAllEvents);
router.get('/nearby', eventController.getNearbyEvents);

module.exports = router;
