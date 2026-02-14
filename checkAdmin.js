import { MongoClient } from 'mongodb';

async function checkAdmin() {
  const uri = "mongodb+srv://GymBro:1234%24%24iheb@cluster0.idqmj5l.mongodb.net/GymBroDB";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const admin = await client.db().collection('users').findOne({
      email: 'admin@gymbro.com',
      role: 'admin'
    });
    console.log('Admin exists:', !!admin);
  } finally {
    await client.close();
  }
}

checkAdmin().catch(console.error);