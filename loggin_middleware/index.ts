import fetch from "node-fetch";

export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogStack = "frontend" | "backend" | "fullstack";

export interface LogConfiguration {
  testServerUrl: string;
}

let config: LogConfiguration = {
  testServerUrl: process.env.TEST_SERVER_URL || "http://localhost:3000/logs",
};

export function configureLogger(newConfig: Partial<LogConfiguration>) {
  config = { ...config, ...newConfig };
}

/**
 * Log function that sends data to a test server.
 * 
 * @param stack - The stack where the log originated (e.g., frontend, backend)
 * @param level - Log severity level
 * @param pkg - The package/module generating the log
 * @param message - The log message or narrative
 */
export async function Log(
  stack: LogStack | string,
  level: LogLevel | string,
  pkg: string,
  message: string | object
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    stack,
    level,
    package: pkg,
    message: typeof message === "string" ? message : JSON.stringify(message),
  };

 
  if (level === "error") {
    console.error(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
  } else if (level === "warn") {
    console.warn(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
  } else {
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
  }


  try {
    await fetch(config.testServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    });
  } catch (error) {
    console.error(`[Logging Middleware Error]: Failed to send log to ${config.testServerUrl}`, error);
  }
}
