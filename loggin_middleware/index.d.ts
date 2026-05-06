export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogStack = "frontend" | "backend" | "fullstack";
export interface LogConfiguration {
    testServerUrl: string;
}
/**
 * Configure the logger's global settings
 */
export declare function configureLogger(newConfig: Partial<LogConfiguration>): void;
/**
 * Log function that sends data to a test server.
 *
 * @param stack - The stack where the log originated (e.g., frontend, backend)
 * @param level - Log severity level
 * @param pkg - The package/module generating the log
 * @param message - The log message or narrative
 */
export declare function Log(stack: LogStack | string, level: LogLevel | string, pkg: string, message: string | object): Promise<void>;
//# sourceMappingURL=index.d.ts.map