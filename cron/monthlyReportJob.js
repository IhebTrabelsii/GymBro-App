import mongoose from 'mongoose';
import 'dotenv/config';
import DailyData from '../models/DailyData.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not defined in environment');
  process.exit(1);
}

/**
 * Generate monthly reports for all users
 */
async function generateMonthlyReports() {
  console.log('📊 Starting monthly report generation...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
    
    // Get previous month (last month)
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prevMonth.getFullYear();
    const month = prevMonth.getMonth() + 1;
    const monthName = prevMonth.toLocaleString('default', { month: 'long' });
    
    // Date range for previous month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    console.log(`📅 Generating reports for: ${monthName} ${year}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users`);
    
    let reportsGenerated = 0;
    
    // Create reports directory
  const reportsDir = path.join(process.cwd(), 'backend', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    for (const user of users) {
      // Get user's daily entries for previous month
      const entries = await DailyData.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 });
      
      console.log(`📝 User ${user.email}: ${entries.length} entries found`);
      
      // Generate report
      const { generateMonthlyReport } = await import('../utils/monthlyReport.js');
      const reportHtml = generateMonthlyReport(
        entries,
        user.username || user.fullName || 'User',
        `${monthName} ${year}`
      );
      
      // Save report to file
      const fileName = `${user._id}_${year}_${String(month).padStart(2, '0')}.html`;
      const filePath = path.join(reportsDir, fileName);
      fs.writeFileSync(filePath, reportHtml);
      
      reportsGenerated++;
      console.log(`✅ Report saved: ${fileName}`);
    }
    
    console.log(`🎉 Monthly reports completed! Generated ${reportsGenerated} reports`);
    
    // Close connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Monthly report generation error:', error);
  }
}

// Run the function
generateMonthlyReports();