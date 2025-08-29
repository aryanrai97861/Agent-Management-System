import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';
import asyncHandler from 'express-async-handler';

// Middleware to verify JWT token
export const authenticateToken = asyncHandler(async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log(`Auth header present: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token or invalid format');
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log(`Token received: ${token.substring(0, 15)}...`);
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully:', decoded);
      
      // Check if user exists in database
      const db = getDb();
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
      
      if (!user) {
        console.log(`User not found for id: ${decoded.id}`);
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      console.log(`User authenticated: ${user.email} (${user.role})`);
      
      // Attach user to request
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.log(`Token verification failed: ${error.message}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error(`Auth middleware error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Middleware to check admin role
export const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed' 
    });
  }
};