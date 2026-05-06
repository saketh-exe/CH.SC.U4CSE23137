var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const getEnvUrl = () => {
    if (typeof process !== "undefined" && process.env && process.env.TEST_SERVER_URL) {
        return process.env.TEST_SERVER_URL;
    }
    return "http://localhost:3000/logs";
};
const getToken = () => {
    if (typeof process !== "undefined" && process.env && process.env.API_TOKEN) {
        return process.env.API_TOKEN;
    }
    return "null";
};
let config = {
    testServerUrl: getEnvUrl(),
    token: getToken()
};
export function configureLogger(newConfig) {
    config = Object.assign(Object.assign({}, config), newConfig);
}
export function Log(stack, level, pkg, message) {
    return __awaiter(this, void 0, void 0, function* () {
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
        }
        else if (level === "warn") {
            console.warn(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
        }
        else {
            console.log(`[${timestamp}] [${level.toUpperCase()}] [${pkg}] - ${logEntry.message}`);
        }
        try {
            yield fetch(config.testServerUrl, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(logEntry),
            });
        }
        catch (error) {
            console.error(`[Logging Middleware Error]: Failed to send log to ${config.testServerUrl}`, error);
        }
    });
}
