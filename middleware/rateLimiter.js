import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';

// Premium users get higher limits
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Check if user is premium (you'll need to pass this info)
    return req.isPremium ? 100 : 10; // 100 for premium, 10 for free (if you have free tier)
  },
  message: {
    success: false,
    error: 'Too many AI requests. Please try again later.'
  },
  standardHeaders: true,
  // Fix: Use ipKeyGenerator helper for IPv6 safety
  keyGenerator: (req) => {
    // If user is authenticated, use their userId as the key (more secure than IP)
    if (req.userId) {
      return `user-${req.userId}`;
    }
    // For unauthenticated requests, use IP with proper IPv6 handling
    return ipKeyGenerator(req.ip);
  },
});