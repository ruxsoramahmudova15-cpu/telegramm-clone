import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
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

const redactSensitiveData = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

const formatLogEntry = (entry: LogEntry): string => {
  const contextStr = entry.context 
    ? ` | ${JSON.stringify(redactSensitiveData(entry.context))}`
    : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
};

const writeToFile = (entry: LogEntry): void => {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOG_DIR, `${date}.log`);
  const logLine = formatLogEntry(entry) + '\n';

  fs.appendFileSync(logFile, logLine);
};

const createLogEntry = (level: LogLevel, message: string, context?: Record<string, any>): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context
});

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    const entry = createLogEntry('info', message, context);
    console.log(formatLogEntry(entry));
    writeToFile(entry);
  },

  warn: (message: string, context?: Record<string, any>) => {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogEntry(entry));
    writeToFile(entry);
  },

  error: (message: string, error?: Error | any, context?: Record<string, any>) => {
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

  debug: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, context);
      console.debug(formatLogEntry(entry));
      writeToFile(entry);
    }
  },

  // Log HTTP request
  request: (req: any, res: any, duration: number) => {
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
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
};

export default logger;