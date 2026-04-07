import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // 🔍 DEBUG LOGS
  console.log('🔍 Auth Header:', authHeader);
  console.log('🔍 Extracted Token:', token);

  if (!token) {
    console.log('🔴 No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('🔴 Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // ✅ Set user info consistently
    console.log('✅ Token verified for user:', decoded.userId);
    req.userId = decoded.userId;      // For routes expecting req.userId
    req.userRole = decoded.role;       // For routes expecting req.userRole
    req.user = {                        // For routes expecting req.user
      id: decoded.userId,
      role: decoded.role
    };
    
    next();
  });
};

export default authenticateToken;