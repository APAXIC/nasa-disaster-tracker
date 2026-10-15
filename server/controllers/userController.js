const db = require('../config/db');

// Save or update user Web Push subscription
exports.updatePushSubscription = async (req, res) => {
  const userId = req.user.userId;
  const { subscription } = req.body;

  try {
    await db('users')
      .where({ id: userId })
      .update({
        push_subscription: subscription ? JSON.stringify(subscription) : null,
        updated_at: db.fn.now()
      });

    res.json({ status: 'success', message: 'Push subscription updated successfully.' });
  } catch (error) {
    console.error('[Push Subscription Error]:', error);
    res.status(500).json({ error: 'Failed to update push subscription.' });
  }
};

// Return public VAPID key to frontend
exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
};