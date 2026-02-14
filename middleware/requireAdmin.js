import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required',
    });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired, please login again'
      : 'Invalid authorization token';
    return res.status(401).json({ success: false, error: message });
  }

  const user = await User.findById(decoded.userId).select('role isActive');
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      error: 'Admin account deactivated',
    });
  }

  req.user = { userId: decoded.userId, role: user.role };
  next();
}
