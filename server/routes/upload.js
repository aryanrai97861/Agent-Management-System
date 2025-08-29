import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { getDb } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import stream from 'stream';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);
router.use(requireAdmin);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, and XLSX files are allowed'), false);
    }
  }
});

// Helper function to parse CSV buffer
const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
  const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse Excel buffer
const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

// Helper function to validate data format
const validateDataFormat = (data) => {
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('File is empty or invalid');
    return { isValid: false, errors };
  }

  // Check required fields
  const requiredFields = ['FirstName', 'Phone', 'Notes'];
  const firstRow = data[0];
  
  for (const field of requiredFields) {
    const fieldVariations = [
      field,
      field.toLowerCase(),
      field.toUpperCase(),
      field.replace(/([A-Z])/g, ' $1').trim(), // FirstName -> First Name
      field.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1) // FirstName -> first_name
    ];
    
    const hasField = fieldVariations.some(variation => 
      firstRow.hasOwnProperty(variation)
    );
    
    if (!hasField) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Normalize field names
  const normalizedData = data.map(row => {
    const normalizedRow = {};
    
    // Find and normalize FirstName
    const firstNameField = Object.keys(row).find(key => 
      ['FirstName', 'firstname', 'FIRSTNAME', 'First Name', 'first_name'].includes(key)
    );
    if (firstNameField) {
      normalizedRow.FirstName = row[firstNameField];
    }

    // Find and normalize Phone
    const phoneField = Object.keys(row).find(key => 
      ['Phone', 'phone', 'PHONE', 'Phone Number', 'phone_number'].includes(key)
    );
    if (phoneField) {
      normalizedRow.Phone = row[phoneField];
    }

    // Find and normalize Notes
    const notesField = Object.keys(row).find(key => 
      ['Notes', 'notes', 'NOTES', 'Note', 'note'].includes(key)
    );
    if (notesField) {
      normalizedRow.Notes = row[notesField];
    }

    return normalizedRow;
  });

  return { isValid: errors.length === 0, errors, data: normalizedData };
};

// Helper function to distribute data among agents
const distributeToAgents = (data, agents) => {
  const distributions = agents.map(agent => ({
    agent_id: agent.id,
    agent_name: agent.name,
    items: []
  }));

  // Distribute items round-robin
  data.forEach((item, index) => {
    const agentIndex = index % agents.length;
    distributions[agentIndex].items.push(item);
  });

  return distributions;
};

// @desc    Upload and distribute CSV/Excel file
// @route   POST /api/upload/distribute
// @access  Private (Admin only)
router.post('/distribute', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  let parsedData;
  
  try {
    // Parse file based on type
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      parsedData = await parseCSVBuffer(req.file.buffer);
    } else {
      parsedData = parseExcelBuffer(req.file.buffer);
    }

    // Validate data format
    const validation = validateDataFormat(parsedData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format',
        errors: validation.errors
      });
    }

    // Get all active agents (limit to 5 as per requirement)
    const db = getDb();
    const agents = await db.collection('agents').find({ status: 'active' }).limit(5).toArray();
    if (!agents || agents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active agents found. Please create agents first.'
      });
    }

    // Distribute data among agents
    const distributions = distributeToAgents(validation.data, agents);

    // Create upload record
    const uploadDoc = {
      filename: req.file.originalname,
      original_count: validation.data.length,
      uploaded_by: req.user.id,
      status: 'processing',
      created_at: new Date().toISOString()
    };
    const uploadResult = await db.collection('uploads').insertOne(uploadDoc);
    const upload = uploadResult.ops ? uploadResult.ops[0] : uploadDoc;

    // Save distributed lists
    for (const distribution of distributions) {
      const assignedListDocs = distribution.items.map(item => ({
        agent_id: distribution.agent_id,
        upload_id: upload._id,
        first_name: item.FirstName,
        phone: item.Phone,
        notes: item.Notes,
        status: 'pending',
        created_at: new Date().toISOString()
      }));
      if (assignedListDocs.length > 0) {
        await db.collection('assigned_lists').insertMany(assignedListDocs);
      }
    }

    // Update upload status
    await db.collection('uploads').updateOne(
      { _id: upload._id },
      { $set: { status: 'completed', processed_at: new Date().toISOString() } }
    );

    // Get distribution summary
    const distributionSummary = distributions.map(d => ({
      agent_id: d.agent_id,
      agent_name: d.agent_name,
      count: d.items.length
    }));

    res.json({
      success: true,
      message: 'File uploaded and distributed successfully',
      data: {
        upload_id: upload.id,
        filename: req.file.originalname,
        total_records: validation.data.length,
        agents_count: agents.length,
        distribution: distributionSummary
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process file',
      error: error.message
    });
  }
}));

// @desc    Get upload history
// @route   GET /api/upload/history
// @access  Private (Admin only)
router.get('/history', asyncHandler(async (req, res) => {
  const db = getDb();
  const uploads = await db.collection('uploads').find({}).sort({ created_at: -1 }).toArray();
  res.json({
    success: true,
    data: { uploads }
  });
}));

// @desc    Get distribution details for specific upload
// @route   GET /api/upload/:uploadId/distribution
// @access  Private (Admin only)
router.get('/:uploadId/distribution', asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const db = getDb();
  const upload = await db.collection('uploads').findOne({ _id: uploadId });
  if (!upload) {
    return res.status(404).json({
      success: false,
      message: 'Upload not found'
    });
  }
  const distributions = await db.collection('assigned_lists').find({ upload_id: uploadId }).toArray();
  // You may need to join agent info manually if needed
  res.json({
    success: true,
    data: {
      upload,
      distribution: distributions
    }
  });
}));

export default router;