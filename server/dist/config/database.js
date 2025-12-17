"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initDatabase = exports.mockDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/telegram-clone';
const USE_MOCK = process.env.USE_MOCK === 'true';
// Mock database storage (fallback)
exports.mockDb = {
    users: new Map(),
    conversations: new Map(),
    messages: new Map(),
    contacts: new Map(),
};
const initDatabase = async () => {
    if (USE_MOCK) {
        console.log('🔶 Running in MOCK mode - no database required');
        console.log('🔶 Data will be stored in memory (lost on restart)');
        return;
    }
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('🔶 Falling back to MOCK mode');
        process.env.USE_MOCK = 'true';
    }
};
exports.initDatabase = initDatabase;
const closeDatabase = async () => {
    if (!USE_MOCK && mongoose_1.default.connection.readyState === 1) {
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
    }
};
exports.closeDatabase = closeDatabase;
exports.default = mongoose_1.default;
