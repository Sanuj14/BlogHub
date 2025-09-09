const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/dashboard');
  },
  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'You do not have permission to view that resource');
    res.redirect('/');
  },
  // New JWT authentication middleware for API routes
  authenticateJWT: function(req, res, next) {
    console.log('Auth headers:', req.headers);
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No auth header provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Check for Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid token format, missing Bearer prefix');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = authHeader.substring(7);
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bloghub_jwt_secret');
      console.log('Token verified successfully:', decoded.id);
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  },
  // API middleware to check for admin role
  ensureAdminAPI: function(req, res, next) {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Admin privileges required' });
  }
}; 