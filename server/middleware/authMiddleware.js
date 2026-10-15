const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Access token expired or invalid' });
  }
};