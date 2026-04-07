import User from '../models/User.js';

export const checkPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has premium plan
    const isPremium = user.plan && user.plan !== 'free';
    
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: 'AI Coach requires a premium subscription',
        requiresUpgrade: true
      });
    }

    // Attach user fitness data for personalization
    req.userFitnessData = {
      fitnessLevel: user.fitnessLevel,
      goal: user.goals?.[0],
      bodyType: user.bodyType,
      height: user.height,
      weight: user.weight,
    };

    next();
  } catch (error) {
    console.error('Premium check error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};