const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

let logFilePath = '/var/log/app.log';

try {
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', { flag: 'a' });
  }
} catch (err) {
  console.warn("Could not write to /var/log/app.log. Falling back:", err.message);
  logFilePath = path.join(__dirname, '../fallback.log');
  fs.writeFileSync(logFilePath, '', { flag: 'a' });
}

const jsonFormat = format.printf(({ timestamp, level, message, stack }) => {
  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    message: stack || message
  });
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    jsonFormat
  ),
  transports: [
    new transports.File({ filename: logFilePath })
  ],
  exitOnError: false
});

module.exports = logger;