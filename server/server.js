const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { syncEonetEvents } = require('./services/eonetService');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const watchZoneRoutes = require('./routes/watchZoneRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/watch-zones', watchZoneRoutes);
app.use('/api/users', userRoutes);

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