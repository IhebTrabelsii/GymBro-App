require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('GymBroDB'); // Your database name
    const usersCollection = db.collection('users'); // Your users collection name

    // Admin user data
    const adminData = {
      username: 'adminuser',
      email: 'admin@example.com',
      password: await bcrypt.hash('StrongAdminPassword123!', 10),
      role: 'admin',
      createdAt: new Date(),
    };

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }

    // Insert admin user
    const result = await usersCollection.insertOne(adminData);
    console.log('Admin user created with id:', result.insertedId);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdmin();
