const express = require('express');
const router = express.Router();

// Import route modules
const uploadRoutes = require('./upload');
const conversationRoutes = require('./conversations');
const metricsRoutes = require('./metrics');
const aiRoutes = require('./ai');
const exportRoutes = require('./export');
const demoRoutes = require('./demo');

// Mount routes
router.use('/upload', uploadRoutes);
router.use('/conversations', conversationRoutes);
router.use('/metrics', metricsRoutes);
router.use('/ai', aiRoutes);
router.use('/export', exportRoutes);
router.use('/demo', demoRoutes);

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
      ai: {
        'GET /ai/config': 'Get AI configuration and status',
        'GET /ai/test-connection': 'Test OpenAI connection',
        'POST /ai/analyze/message/:id': 'Analyze specific message',
        'POST /ai/analyze/conversation/:id': 'Analyze conversation',
        'POST /ai/analyze/pending': 'Analyze pending messages',
        'GET /ai/analysis/intention/:intention': 'Get analysis by intention',
        'GET /ai/analysis/politeness-trends': 'Get politeness trends',
        'GET /ai/analysis/sentiment': 'Get sentiment analysis',
        'GET /ai/analysis/stats': 'Get analysis statistics',
        'POST /ai/insights/generate': 'Generate insights',
        'GET /ai/insights': 'Get generated insights',
        'PATCH /ai/insights/:id/addressed': 'Mark insight as addressed'
      },
      export: {
        'POST /export/pdf': 'Generate PDF report',
        'POST /export/csv': 'Generate CSV export',
        'GET /export/formats': 'Get available export formats',
        'GET /export/history': 'Get export history'
      }
    }
  });
});

module.exports = router;