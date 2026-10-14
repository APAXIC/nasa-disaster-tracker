const express = require('express');
const router = express.Router();
const watchZoneController = require('../controllers/watchZoneController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', watchZoneController.createWatchZone);
router.get('/', watchZoneController.getUserWatchZones);
router.get('/:id', watchZoneController.getWatchZoneById);
router.put('/:id', watchZoneController.updateWatchZone);
router.delete('/:id', watchZoneController.deleteWatchZone);

module.exports = router;