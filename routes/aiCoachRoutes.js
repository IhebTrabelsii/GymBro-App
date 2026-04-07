import express from 'express';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';
import { checkAILimit, messageCounts } from '../middleware/aiRateLimit.js'; // 👈 Add messageCounts here
import { fitnessGuardrail } from '../middleware/aiGuardrail.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { getAICoachResponse } from '../utils/aiCoachService.js';

const router = express.Router();

router.post(
  '/chat', 
  authenticateToken,
  checkAILimit,
  aiRateLimiter,
  fitnessGuardrail,
  async (req, res) => {
    try {
      console.log("📥 [CHAT ROUTE] Requête reçue");
      console.log("📥 Body:", req.body);
      console.log("📥 UserId:", req.userId);
      console.log("📥 MessageCount:", req.messageCount);
      
      const { message } = req.body;
      
      if (!message) {
        console.log("❌ Message manquant");
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      console.log("📥 Message reçu:", message);

      // Get user data for personalization
      const user = await User.findById(req.userId);
      if (!user) {
        console.log("❌ Utilisateur non trouvé");
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      console.log("📥 Utilisateur trouvé:", user.email, "Plan:", user.plan);

      const userContext = {
        fitnessLevel: user.fitnessLevel,
        goal: user.goals?.[0],
        bodyType: user.bodyType,
        height: user.height,
        weight: user.weight,
      };
      
      console.log("📥 Contexte utilisateur:", userContext);

      // Get AI response
      console.log("📥 Appel à getAICoachResponse...");
      const result = await getAICoachResponse(message, userContext);
      console.log("📥 Résultat reçu:", result.success ? "Succès" : "Échec");

      if (result.success) {
        const response = {
          success: true,
          reply: result.reply,
        };
        
        if (user.plan === 'free' && req.messageCount) {
          response.limit = {
            used: req.messageCount,
            total: 10,
            remaining: 10 - req.messageCount
          };
        }
        
        console.log("✅ Réponse envoyée");
        res.json(response);
      } else {
        console.log("❌ Erreur AI:", result.error);
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to get AI response'
        });
      }
      
    } catch (error) {
      console.error("❌ Chat route error:", error);
      res.status(500).json({ 
        success: false, 
        error: 'Server error. Please try again.' 
      });
    }
  }
);
// Get remaining messages for free users
router.get('/limits', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user.plan !== 'free') {
      return res.json({
        success: true,
        plan: 'premium',
        unlimited: true
      });
    }
    
    const today = new Date().toDateString();
    const key = `${req.userId}-${today}`;
    const used = messageCounts?.get(key) || 0;
    const FREE_LIMIT = 10;
    
    res.json({
      success: true,
      plan: 'free',
      limit: FREE_LIMIT,
      used,
      remaining: FREE_LIMIT - used
    });
  } catch (error) {
    console.error('Limits error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

export default router;