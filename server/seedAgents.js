import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'your_db_name_here';

async function seedAgents() {
  const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);

  const agents = [
    { name: 'Agent One', email: 'agent1@example.com', mobile: '1111111111' },
    { name: 'Agent Two', email: 'agent2@example.com', mobile: '2222222222' },
    { name: 'Agent Three', email: 'agent3@example.com', mobile: '3333333333' },
    { name: 'Agent Four', email: 'agent4@example.com', mobile: '4444444444' },
    { name: 'Agent Five', email: 'agent5@example.com', mobile: '5555555555' }
  ];

  // Hash a default password for agents
  const defaultPassword = await bcrypt.hash('agentpassword', 12);

  const agentDocs = agents.map(a => ({
    name: a.name,
    email: a.email,
    mobile: a.mobile,
    country_code: '+1',
    password: defaultPassword,
    status: 'active',
    created_by: null,
    created_at: new Date(),
    updated_at: new Date()
  }));

  const result = await db.collection('agents').insertMany(agentDocs);
  console.log(`Inserted ${result.insertedCount} agents into database "${dbName}"`);
  console.log('Inserted IDs:', Object.values(result.insertedIds));

  await client.close();
}

seedAgents().catch(err => {
  console.error('Failed to seed agents:', err);
  process.exit(1);
});
