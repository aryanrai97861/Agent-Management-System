import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private (Admin only)
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const agents = await db.collection('agents').find({}).sort({ created_at: -1 }).toArray();
  // You may need to aggregate assigned_lists count if required
  res.json({
    success: true,
    data: { agents },
    count: agents.length
  });
}));
// @desc    Get single agent
// @route   GET /api/agents/:id
// @access  Private (Admin only)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const agent = await db.collection('agents').findOne({ _id: id });
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }
  res.json({
    success: true,
    data: { agent }
  });
}));

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private (Admin only)
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, mobile, password, countryCode } = req.body;

  // Validation
  if (!name || !email || !mobile || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Mobile validation
  const mobileRegex = /^\d{10,15}$/;
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid mobile number'
    });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Check if email already exists
  const db = getDb();
  const existingAgent = await db.collection('agents').findOne({ email: email.toLowerCase() });
  if (existingAgent) {
    return res.status(409).json({
      success: false,
      message: 'Agent with this email already exists'
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create agent
  const agentDoc = {
    name: name.trim(),
    email: email.toLowerCase(),
    mobile,
    country_code: countryCode || '+1',
    password: hashedPassword,
    created_by: req.user.id,
    created_at: new Date().toISOString()
  };
  const result = await db.collection('agents').insertOne(agentDoc);
  const agent = result.ops ? result.ops[0] : agentDoc;
  const { password: _, ...agentData } = agent;
  res.status(201).json({
    success: true,
    message: 'Agent created successfully',
    data: { agent: agentData }
  });
}));

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private (Admin only)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, countryCode, password } = req.body;

  // Check if agent exists
  const db = getDb();
  const existingAgent = await db.collection('agents').findOne({ _id: id });
  if (!existingAgent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Prepare update data
  const updateData = {};
  
  if (name) updateData.name = name.trim();
  if (email) {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    updateData.email = email.toLowerCase();
  }
  if (mobile) {
    // Mobile validation
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number'
      });
    }
    updateData.mobile = mobile;
  }
  if (countryCode) updateData.country_code = countryCode;
  
  // Hash password if provided
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    const saltRounds = 12;
    updateData.password = await bcrypt.hash(password, saltRounds);
  }

  updateData.updated_at = new Date().toISOString();

  // Update agent
  await db.collection('agents').updateOne({ _id: id }, { $set: updateData });
  const updatedAgent = await db.collection('agents').findOne({ _id: id });
  const { password: _, ...agentData } = updatedAgent;
  res.json({
    success: true,
    message: 'Agent updated successfully',
    data: { agent: agentData }
  });
}));

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if agent exists
  const db = getDb();
  const agent = await db.collection('agents').findOne({ _id: id });
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Delete agent (this will cascade to assigned_lists due to foreign key)
  await db.collection('agents').deleteOne({ _id: id });
  res.json({
    success: true,
    message: 'Agent deleted successfully'
  });
}));

export default router;