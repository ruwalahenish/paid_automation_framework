import { createLogger, format, transports } from "winston";
import path from "path";

let loggerInstance = null;

export function createTestLogger(testFilePath) {
  if (loggerInstance) {
    return loggerInstance; // Reuse the existing logger instance
  }

  // Extract the base name of the test file
  const testFileName = path.basename(testFilePath, path.extname(testFilePath));

  // Generate a unique timestamp for the log file
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date
    .getHours()
    .toString()
    .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}-${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const creationDate = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

  // Define log file path
  const logFilePath = `paid-qa-logs/${creationDate}/${testFileName}-logs-${timestamp}.log`;

  // Create a singleton logger instance
  loggerInstance = createLogger({
    level: "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: logFilePath }), // Log to a single file
    ],
  });

  return loggerInstance;
}
