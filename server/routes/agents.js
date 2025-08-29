import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';
import { ObjectId } from 'mongodb';
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
  // Optional query param to filter by status, e.g. /api/agents?status=active
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const agents = await db.collection('agents').find(filter).sort({ created_at: -1 }).toArray();
  
  // Get assigned lists count for each agent
  const agentsWithCounts = await Promise.all(
    agents.map(async (agent) => {
      const assignedCount = await db.collection('assigned_lists').countDocuments({ 
        agent_id: agent._id 
      });
      return {
        ...agent,
        assigned_lists_count: assignedCount
      };
    })
  );
  
  res.json({
    success: true,
    data: { agents: agentsWithCounts },
    count: agentsWithCounts.length
  });
}));

// @desc    Get assigned lists for a specific agent
// @route   GET /api/agents/:id/assigned-lists
// @access  Private (Admin only)
router.get('/:id/assigned-lists', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const db = getDb();
  
  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid agent ID format'
    });
  }
  
  // Check if agent exists
  const agent = await db.collection('agents').findOne({ _id: new ObjectId(id) });
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Get assigned lists with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const assignedLists = await db.collection('assigned_lists')
    .find({ agent_id: new ObjectId(id) })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .toArray();

  // Get total count
  const totalCount = await db.collection('assigned_lists').countDocuments({ agent_id: new ObjectId(id) });

  // Get upload info for each assigned list
  const listsWithUploadInfo = await Promise.all(
    assignedLists.map(async (list) => {
      const upload = await db.collection('uploads').findOne({ _id: list.upload_id });
      return {
        ...list,
        upload_filename: upload?.filename || 'Unknown',
        upload_date: upload?.created_at || list.created_at
      };
    })
  );

  res.json({
    success: true,
    data: {
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email
      },
      assigned_lists: listsWithUploadInfo,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        total_count: totalCount,
        per_page: parseInt(limit)
      }
    }
  });
}));
// @desc    Get single agent
// @route   GET /api/agents/:id
// @access  Private (Admin only)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const agent = await db.collection('agents').findOne({ _id: new ObjectId(id) });
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
    status: req.body.status || 'active',
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
  console.log('=== PUT /api/agents/:id called ===');
  console.log('Agent ID:', req.params.id);
  console.log('Request body:', req.body);
  console.log('User from token:', req.user?.email);
  
  const { id } = req.params;
  const { name, email, mobile, countryCode, password, status } = req.body;

  // Check if agent exists
  const db = getDb();
  const existingAgent = await db.collection('agents').findOne({ _id: new ObjectId(id) });
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
  if (status) updateData.status = status;
  
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
  await db.collection('agents').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  const updatedAgent = await db.collection('agents').findOne({ _id: new ObjectId(id) });
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
  const agent = await db.collection('agents').findOne({ _id: new ObjectId(id) });
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Delete agent (this will cascade to assigned_lists due to foreign key)
  await db.collection('agents').deleteOne({ _id: new ObjectId(id) });
  res.json({
    success: true,
    message: 'Agent deleted successfully'
  });
}));

export default router;