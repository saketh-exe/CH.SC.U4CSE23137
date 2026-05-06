declare var process: any;

export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogStack = "frontend" | "backend" | "fullstack";

export interface LogConfiguration {
  testServerUrl: string;
  token: string;
}

const getEnvUrl = () => {
    if (typeof process !== "undefined" && process.env && process.env.TEST_SERVER_URL) {
        return process.env.TEST_SERVER_URL;
    }
    return "http://localhost:3000/logs";
};

const getToken = () =>{
  if (typeof process !== "undefined" && process.env && process.env.API_TOKEN) {
    return process.env.API_TOKEN;
}
return "null";
}
let config: LogConfiguration = {
  testServerUrl: getEnvUrl(),
  token: getToken()
};

export function configureLogger(newConfig: Partial<LogConfiguration>) {
  config = { ...config, ...newConfig };
}

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
         'Authorization': `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    });
  } catch (error) {
    console.error(`[Logging Middleware Error]: Failed to send log to ${config.testServerUrl}`, error);
  }
}
