
const axios = require('axios');

const EONET_API_URL = process.env.EONET_API_URL || 'https://eonet.gsfc.nasa.gov/api/v3/events';

const EONET_EVENTS_URL = EONET_API_URL.replace(/\/+$/, '').replace(/\/events$/, '');
const MAX_ANALYSIS_LIMIT = 10000;

async function fetchHistoricalEvents({
                                       start,
                                       end,
                                       category,
                                       status = 'all',
                                       limit = MAX_ANALYSIS_LIMIT
                                     }) {
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > MAX_ANALYSIS_LIMIT
  ) {
    throw new Error('Analysis limit must be an integer between 1 and 10000.');
  }

  const params = {
    start,
    end,
    status,
    limit: parsedLimit
  };

  if (category) {
    params.category = category;
  }

  const response = await axios.get(`${EONET_EVENTS_URL}/events`, {
    params,
    timeout: 30000
  });

  if (!Array.isArray(response.data?.events)) {
    throw new Error('NASA EONET returned an invalid events response.');
  }

  const events = response.data.events;

  return {
    query: {
      start,
      end,
      category: category || null,
      status,
      limit: parsedLimit
    },
    totalFetched: events.length,
    count: events.length,
    truncated: events.length >= parsedLimit,
    data: events
  };
}

async function fetchEonetCategories() {
  const response = await axios.get(`${EONET_EVENTS_URL}/categories`, {
    timeout: 15000
  });

  if (!Array.isArray(response.data?.categories)) {
    throw new Error('NASA EONET returned an invalid categories response.');
  }

  return response.data.categories;
}

module.exports = {
  fetchHistoricalEvents,
  fetchEonetCategories
};
