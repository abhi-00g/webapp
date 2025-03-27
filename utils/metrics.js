const StatsD = require('hot-shots');
const client = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'webapp.',
  errorHandler: (error) => {
    console.error('StatsD Error:', error);
  },
});

module.exports = client;