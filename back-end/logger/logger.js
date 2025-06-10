const winston = require("winston");
const { printf, timestamp, combine, errors, prettyPrint } = winston.format;
require("winston-daily-rotate-file");

var transport = new winston.transports.DailyRotateFile({
  level: "info",
  filename: "./logs" + "/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "10d",
});

transport.on("error", (error) => {
  console.log(error);
});

// transport.on("rotate", (oldFilename, newFilename) => {
//   // do something fun
// });

const logger = winston.createLogger({
  level: "info",
  format: combine(
    errors({ stack: true }),
    timestamp(),
    prettyPrint(),
    printf((error) => `\n${error.timestamp} ${error.stack || error.message}`)
  ),
  transports: [transport],
});

module.exports = {
  logger,
};
