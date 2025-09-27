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

// Upload chat files
router.post(
  '/',
  upload,
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