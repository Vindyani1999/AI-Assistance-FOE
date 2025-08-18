// Authentication middleware using JWT
const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[authMiddleware] Incoming request:', req.method, req.originalUrl);
  if (!token) {
    console.log('[authMiddleware] No token provided.');
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('[authMiddleware] Invalid or expired token:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    // Issue a new token (rolling token)
    const newToken = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '60m' }
    );
    res.set('x-access-token', newToken);
    console.log('[authMiddleware] Authenticated user:', user.email, '| New token issued.');
    next();
  });
};
