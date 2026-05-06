export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogStack = "frontend" | "backend" | "fullstack";
export interface LogConfiguration {
    testServerUrl: string;
    token: string;
}
export declare function configureLogger(newConfig: Partial<LogConfiguration>): void;
export declare function Log(stack: LogStack | string, level: LogLevel | string, pkg: string, message: string | object): Promise<void>;
