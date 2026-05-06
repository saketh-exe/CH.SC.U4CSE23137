"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLogger = configureLogger;
exports.Log = Log;
const node_fetch_1 = __importDefault(require("node-fetch"));
let config = {
    testServerUrl: process.env.TEST_SERVER_URL || "http://localhost:3000/logs",
};
/**
 * Configure the logger's global settings
 */
function configureLogger(newConfig) {
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
async function Log(stack, level, pkg, message) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        stack,
        level,
        package: pkg,
        message: typeof message === "string" ? message : JSON.stringify(message),
    };
    // Also log to local console for immediate developer feedback
    if (level === "error") {
        console.error(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
    }
    else if (level === "warn") {
        console.warn(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
    }
    else {
        console.log(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
    }
    // Send to remote Test Server
    try {
        await (0, node_fetch_1.default)(config.testServerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(logEntry),
        });
    }
    catch (error) {
        // Failsafe in case the remote logging server is down
        console.error(`[Logging Middleware Error]: Failed to send log to ${config.testServerUrl}`, error);
    }
}
//# sourceMappingURL=index.js.map