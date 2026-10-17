
const {
  fetchHistoricalEvents,
  fetchEonetCategories
} = require('../services/historicalEventService');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

exports.getHistoricalEvents = async (req, res) => {
  const {
    start,
    end,
    category,
    status = 'all',
    limit = '10000'
  } = req.query;

  if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({
      error: 'Valid start and end dates in YYYY-MM-DD format are required.'
    });
  }

  if (start > end) {
    return res.status(400).json({
      error: 'The start date must not be later than the end date.'
    });
  }

  if (!['open', 'closed', 'all'].includes(status)) {
    return res.status(400).json({
      error: 'Status must be open, closed, or all.'
    });
  }

  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 10000
  ) {
    return res.status(400).json({
      error: 'Limit must be an integer between 1 and 10000.'
    });
  }

  if (category !== undefined &&
    (typeof category !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(category))) {
    return res.status(400).json({
      error: 'Invalid category.'
    });
  }

  try {
    const result = await fetchHistoricalEvents({
      start,
      end,
      category,
      status,
      limit: parsedLimit
    });

    return res.json(result);
  } catch (error) {
    console.error('[Historical Events Error]:', error.message);

    return res.status(502).json({
      error: 'Failed to retrieve historical events from NASA EONET.'
    });
  }
};

exports.getHistoricalCategories = async (req, res) => {
  try {
    const categories = await fetchEonetCategories();
    return res.json({ count: categories.length, data: categories });
  } catch (error) {
    console.error('[Historical Categories Error]:', error.message);

    return res.status(502).json({
      error: 'Failed to retrieve categories from NASA EONET.'
    });
  }
};
