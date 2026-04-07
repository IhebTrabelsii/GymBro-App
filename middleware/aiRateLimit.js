import User from '../models/User.js'; // Add this import!

// Track daily message counts (simple in-memory store)
export const messageCounts = new Map(); // 👈 Add 'export' keyword

export const checkAILimit = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Fix: Check if user exists
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const user = await User.findById(userId);
    
    // Fix: Handle case where user is not found
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Premium users have unlimited access
    if (user.plan !== 'free') {
      return next();
    }
    
    // Free users: check daily limit
    const today = new Date().toDateString();
    const key = `${userId}-${today}`;
    
    const currentCount = messageCounts.get(key) || 0;
    const FREE_LIMIT = 10; // 10 messages per day for free users
    
    if (currentCount >= FREE_LIMIT) {
      return res.status(403).json({
        success: false,
        error: 'You\'ve reached your daily limit. Upgrade to Pro for unlimited messages!',
        requiresUpgrade: true,
        limit: FREE_LIMIT,
        used: currentCount
      });
    }
    
    // Increment count and attach to request
    messageCounts.set(key, currentCount + 1);
    req.messageCount = currentCount + 1;
    
    next();
  } catch (error) {
    console.error('AI rate limit error:', error);
    // Allow request to proceed if rate limiting fails
    next();
  }
};