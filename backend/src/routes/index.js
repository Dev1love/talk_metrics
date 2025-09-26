const express = require('express');
const router = express.Router();

// Import route modules
const uploadRoutes = require('./upload');
const conversationRoutes = require('./conversations');

// Mount routes
router.use('/upload', uploadRoutes);
router.use('/conversations', conversationRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TalkMetrics API v1',
    version: '1.0.0',
    endpoints: {
      upload: {
        'POST /upload': 'Upload chat files for processing',
        'GET /upload/history': 'Get upload history',
        'GET /upload/:uploadId': 'Get upload details',
        'DELETE /upload/:uploadId': 'Delete upload record'
      },
      conversations: {
        'GET /conversations': 'List all conversations with metrics',
        'GET /conversations/:id': 'Get conversation with messages',
        'GET /conversations/:id/messages': 'Get messages for conversation',
        'PATCH /conversations/:id/status': 'Update conversation status',
        'GET /conversations/date-range/:start/:end': 'Get conversations by date range',
        'GET /conversations/:id/response-times': 'Get response time statistics',
        'DELETE /conversations/:id': 'Delete conversation'
      },
      metrics: {
        'GET /metrics': 'Get global metrics (coming soon)',
        'GET /metrics/conversation/:id': 'Get conversation metrics (coming soon)'
      },
      insights: {
        'GET /insights': 'Get generated insights (coming soon)'
      },
      reports: {
        'GET /reports/pdf': 'Generate PDF report (coming soon)',
        'GET /reports/csv': 'Generate CSV export (coming soon)'
      }
    }
  });
});

module.exports = router;