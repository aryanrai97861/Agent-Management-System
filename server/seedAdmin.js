import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const mongoUrl = 'mongodb://localhost:27017'; // Update if needed
const dbName = 'your_db_name_here'; // Use your actual DB name

async function seedAdmin() {
  const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);

  const password = await bcrypt.hash('adminpassword', 12); // Change password as needed

  await db.collection('users').insertOne({
    name: 'Admin User',
    email: 'admin@example.com',
    password,
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
    last_login: null
  });

  console.log('Admin user seeded!');
  await client.close();
}

seedAdmin();