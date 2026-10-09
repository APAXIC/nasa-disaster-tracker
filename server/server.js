const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { syncEonetEvents } = require('./services/eonetService');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/events', eventRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Express server is running!' });
});

app.post('/api/sync', async (req, res) => {
  try {
    await syncEonetEvents();
    res.json({ status: 'success', message: 'EONET sync completed.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Sync failed.' });
  }
});

cron.schedule('0 */2 * * *', () => {
  console.log('[Cron Job] Triggering automatic NASA EONET sync...');
  syncEonetEvents();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  if (process.env.NODE_ENV === 'development') {
    syncEonetEvents();
  }
});