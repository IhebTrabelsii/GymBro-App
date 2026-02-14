import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config();

async function resetPassword() {
  const newPassword = process.env.ADMIN_RESET_PASSWORD || "NewSecurePass123!";
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const newHash = await bcrypt.hash(newPassword, 12);

    const result = await client.db('GymBroDB').collection('users').updateOne(
      { email: process.env.ADMIN_EMAIL },
      { $set: { password: newHash } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ Admin not found');
    } else if (result.modifiedCount === 1) {
      console.log(`✅ Password reset for ${process.env.ADMIN_EMAIL}`);
      console.log(`New password: ${newPassword}`); // Only shown once!
    } else {
      console.log(`ℹ️ Password was already set to this value.`);
    }
  } catch (err) {
    console.error('❌ Error resetting password:', err);
  } finally {
    await client.close();
  }
}

resetPassword().catch(console.error);
