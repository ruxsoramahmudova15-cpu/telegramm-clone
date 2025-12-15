import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/telegram-clone';

async function dropIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database not found');
      return;
    }

    // Drop users collection indexes
    try {
      await db.collection('users').dropIndexes();
      console.log('Dropped all indexes from users collection');
    } catch (e) {
      console.log('No indexes to drop or collection does not exist');
    }

    // Optionally drop the entire collection
    try {
      await db.collection('users').drop();
      console.log('Dropped users collection');
    } catch (e) {
      console.log('Users collection does not exist');
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

dropIndexes();
