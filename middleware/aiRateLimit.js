import User from '../models/User.js';

// Remove the messageCounts Map - we don't need it
// export const messageCounts = new Map();

export const checkAILimit = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Premium users have unlimited access
    if (user.plan !== 'free') {
      req.isPremium = true;
      return next();
    }
    
    // ✅ Check database field instead of in-memory Map
    const remainingMessages = user.aiMessagesRemaining ?? 10;
    
    if (remainingMessages <= 0) {
      return res.status(403).json({
        success: false,
        error: 'You\'ve used all your messages. Complete missions to earn more or upgrade to Pro!',
        requiresUpgrade: true,
        remaining: 0
      });
    }
    
    // Attach user to request for later use
    req.userDoc = user;
    req.remainingMessages = remainingMessages;
    
    next();
  } catch (error) {
    console.error('AI rate limit error:', error);
    next();
  }
};