import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    
    const prices = {
      monthly: 499, // $4.99 in cents
      yearly: 3999, // $39.99 in cents
      lifetime: 8999 // $89.99 in cents
    };
    
    const amount = prices[planId];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: req.userId,
        plan: planId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment success
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, planId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update user's plan
      await User.findByIdAndUpdate(req.userId, {
        plan: planId,
        premiumSince: new Date()
      });
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;