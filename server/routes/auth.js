import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @desc    Login admin user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const db = getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  console.log('Login attempt:', { email });
  console.log('User found:', user);

  if (!user) {
    console.log('No user found for email:', email.toLowerCase());
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  console.log('Password valid:', isValidPassword);
  if (!isValidPassword) {
    console.log('Password mismatch for user:', email.toLowerCase());
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user._id.toString(),  // Convert ObjectId to string
      email: user.email,
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE }
  );

  console.log(`Generated token for ${user.email}: ${token.substring(0, 15)}...`);

  // Update last login
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { last_login: new Date().toISOString() } }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    }
  });
}));

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  // Fetch user from DB for latest info
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: req.user.userId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login
      }
    }
  });
}));

export default router;