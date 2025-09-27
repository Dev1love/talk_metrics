const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const {
  upload,
  handleUploadErrors,
  validatePlatform,
  addFileMetadata
} = require('../middleware/uploadHandler');

// Test endpoint to verify routing
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Upload route is working!' });
});

// Test POST endpoint
router.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload POST route is working!',
    body: req.body,
    headers: req.headers
  });
});

// Simple upload test without middleware
router.post('/simple', (req, res) => {
  console.log('Simple upload endpoint hit!');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  console.log('Headers:', req.headers);
  res.json({ success: true, message: 'Simple upload endpoint working' });
});

// Upload chat files
router.post(
  '/',
  (req, res, next) => {
    console.log('Upload endpoint hit - before multer');
    next();
  },
  upload,
  (req, res, next) => {
    console.log('Upload endpoint - after multer, before error handler');
    next();
  },
  handleUploadErrors,
  validatePlatform,
  addFileMetadata,
  uploadController.uploadFiles
);

// Get upload history
router.get('/history', uploadController.getUploadHistory);

// Get specific upload details
router.get('/:uploadId', uploadController.getUploadDetails);

// Delete upload record
router.delete('/:uploadId', uploadController.deleteUpload);

module.exports = router;