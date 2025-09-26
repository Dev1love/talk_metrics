const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(logger.error);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'txt,json')
    .split(',')
    .map(type => type.trim());

  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    const error = new Error(`File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    error.statusCode = 400;
    cb(error, false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Max 5 files at once
  },
  fileFilter: fileFilter
});

// Custom middleware to handle upload errors
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size: ${(parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024) / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 5 files allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name';
        break;
      default:
        message = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: { message }
    });
  }

  if (error.statusCode === 400) {
    return res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }

  next(error);
};

// Middleware to validate platform parameter
const validatePlatform = (req, res, next) => {
  const { platform } = req.body;
  const allowedPlatforms = ['whatsapp', 'telegram'];

  if (!platform) {
    return res.status(400).json({
      success: false,
      error: { message: 'Platform parameter is required (whatsapp or telegram)' }
    });
  }

  if (!allowedPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: { message: `Invalid platform. Allowed: ${allowedPlatforms.join(', ')}` }
    });
  }

  req.body.platform = platform.toLowerCase();
  next();
};

// Middleware to add file metadata
const addFileMetadata = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No files uploaded' }
    });
  }

  // Add metadata to each file
  req.files.forEach(file => {
    file.type = path.extname(file.originalname).toLowerCase().slice(1);
    file.platform = req.body.platform;
  });

  next();
};

// Clean up uploaded files in case of error
const cleanupFiles = async (files) => {
  if (!files || files.length === 0) return;

  for (const file of files) {
    try {
      await fs.unlink(file.path);
      logger.info(`Cleaned up file: ${file.path}`);
    } catch (error) {
      logger.error(`Failed to cleanup file ${file.path}:`, error);
    }
  }
};

module.exports = {
  upload: upload.array('files', 5), // Accept up to 5 files with field name 'files'
  handleUploadErrors,
  validatePlatform,
  addFileMetadata,
  cleanupFiles
};