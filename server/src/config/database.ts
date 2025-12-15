import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/telegram-clone';
const USE_MOCK = process.env.USE_MOCK === 'true';

// Mock database storage (fallback)
export const mockDb = {
  users: new Map<string, any>(),
  conversations: new Map<string, any>(),
  messages: new Map<string, any>(),
  contacts: new Map<string, any>(),
};

export const initDatabase = async (): Promise<void> => {
  if (USE_MOCK) {
    console.log('🔶 Running in MOCK mode - no database required');
    console.log('🔶 Data will be stored in memory (lost on restart)');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('🔶 Falling back to MOCK mode');
    process.env.USE_MOCK = 'true';
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (!USE_MOCK && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

export default mongoose;
