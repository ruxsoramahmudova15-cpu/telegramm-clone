"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_DIR = path_1.default.join(process.cwd(), 'logs');
// Ensure log directory exists
if (!fs_1.default.existsSync(LOG_DIR)) {
    fs_1.default.mkdirSync(LOG_DIR, { recursive: true });
}
// Sensitive fields to redact
const SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'authorization',
    'cookie',
    'secret',
    'apiKey',
    'api_key',
    'creditCard',
    'ssn'
];
const redactSensitiveData = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(redactSensitiveData);
    }
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'object') {
            redacted[key] = redactSensitiveData(value);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
};
const formatLogEntry = (entry) => {
    const contextStr = entry.context
        ? ` | ${JSON.stringify(redactSensitiveData(entry.context))}`
        : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
};
const writeToFile = (entry) => {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path_1.default.join(LOG_DIR, `${date}.log`);
    const logLine = formatLogEntry(entry) + '\n';
    fs_1.default.appendFileSync(logFile, logLine);
};
const createLogEntry = (level, message, context) => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    context
});
exports.logger = {
    info: (message, context) => {
        const entry = createLogEntry('info', message, context);
        console.log(formatLogEntry(entry));
        writeToFile(entry);
    },
    warn: (message, context) => {
        const entry = createLogEntry('warn', message, context);
        console.warn(formatLogEntry(entry));
        writeToFile(entry);
    },
    error: (message, error, context) => {
        const errorContext = {
            ...context,
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorName: error?.name
        };
        const entry = createLogEntry('error', message, errorContext);
        console.error(formatLogEntry(entry));
        writeToFile(entry);
    },
    debug: (message, context) => {
        if (process.env.NODE_ENV === 'development') {
            const entry = createLogEntry('debug', message, context);
            console.debug(formatLogEntry(entry));
            writeToFile(entry);
        }
    },
    // Log HTTP request
    request: (req, res, duration) => {
        const entry = createLogEntry('info', 'HTTP Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection?.remoteAddress
        });
        writeToFile(entry);
    }
};
// Express middleware for request logging
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        exports.logger.request(req, res, duration);
    });
    next();
};
exports.requestLogger = requestLogger;
exports.default = exports.logger;
