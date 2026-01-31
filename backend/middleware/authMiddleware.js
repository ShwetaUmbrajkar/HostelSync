const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  console.log('Auth header present:', !!req.headers.authorization, 'token-string-length:', token ? token.length : 0);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      next();
    } catch (err) {
      res.status(401).json({ msg: 'Invalid token' });
    }
  } else {
    console.warn('No token provided in request headers. Headers:', req.headers);
    res.status(401).json({ msg: 'No token' });
  }
};

const roleCheck = (roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) next();
  else res.status(403).json({ msg: 'Access denied' });
};

module.exports = { protect, roleCheck };