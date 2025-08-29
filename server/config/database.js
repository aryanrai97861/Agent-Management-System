import dotenv from 'dotenv';
dotenv.config(); // Make sure this runs before any database connection

import { MongoClient } from 'mongodb';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'testdb';
let db = null;

export const connectToDatabase = async () => {
  try {
    const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export const getDb = () => db;

// Initialize MongoDB connection
connectToDatabase();