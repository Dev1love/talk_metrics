const express = require('express');
const router = express.Router();

// Import route modules
const uploadRoutes = require('./upload');
const conversationRoutes = require('./conversations');
const metricsRoutes = require('./metrics');

// Mount routes
router.use('/upload', uploadRoutes);
router.use('/conversations', conversationRoutes);
router.use('/metrics', metricsRoutes);

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
        'GET /metrics': 'Get global metrics and CCI',
        'GET /metrics/conversation/:id': 'Get conversation metrics',
        'POST /metrics/conversation/:id/recalculate': 'Recalculate conversation metrics',
        'GET /metrics/cci': 'Calculate Communication Quality Index',
        'GET /metrics/summary': 'Get metrics summary by platform',
        'GET /metrics/analytics/response-times': 'Get response time analytics',
        'GET /metrics/analytics/conversions': 'Get conversion analytics',
        'POST /metrics/recalculate-all': 'Recalculate all metrics'
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