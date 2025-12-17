"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const database_1 = require("./config/database");
const socket_1 = require("./socket");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// CORS configuration - production va development uchun
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL || ''].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        }
        else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use(logger_1.requestLogger);
// Static files for uploads
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use('/api/contacts', contact_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        await (0, database_1.initDatabase)();
        // Initialize Socket.IO
        (0, socket_1.initializeSocket)(httpServer);
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
};
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    const { closeDatabase } = require('./config/database');
    await closeDatabase();
    logger_1.logger.info('Database connections closed');
    logger_1.logger.info('Graceful shutdown completed');
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection', reason);
});
startServer();
