const express = require('express');
const router = express.Router();
const { getMockGlobalMetrics, getMockInsights, getMockConversations } = require('../controllers/demoController');

// Demo routes that work without database
router.get('/metrics', (req, res) => {
  res.json(getMockGlobalMetrics());
});

router.get('/insights', (req, res) => {
  res.json(getMockInsights());
});

router.get('/conversations', (req, res) => {
  res.json(getMockConversations());
});

// Export endpoints for demo
router.get('/export/pdf', (req, res) => {
  res.json({
    success: true,
    data: {
      downloadUrl: '/api/v1/demo/download/report.pdf',
      filename: 'talk-metrics-report.pdf'
    }
  });
});

router.get('/export/csv', (req, res) => {
  res.json({
    success: true,
    data: {
      downloadUrl: '/api/v1/demo/download/metrics.csv',
      filename: 'talk-metrics-data.csv'
    }
  });
});

module.exports = router;