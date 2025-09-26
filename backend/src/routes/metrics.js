const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

// Get global metrics and CCI
router.get('/', metricsController.getGlobalMetrics);

// Get metrics for specific conversation
router.get('/conversation/:conversationId', metricsController.getConversationMetrics);

// Recalculate metrics for specific conversation
router.post('/conversation/:conversationId/recalculate', metricsController.recalculateConversationMetrics);

// Calculate CCI (Communication Quality Index)
router.get('/cci', metricsController.calculateCCI);

// Get metrics summary by platform/period
router.get('/summary', metricsController.getMetricsSummary);

// Get response time analytics
router.get('/analytics/response-times', metricsController.getResponseTimeAnalytics);

// Get conversion analytics
router.get('/analytics/conversions', metricsController.getConversionAnalytics);

// Recalculate all metrics (admin function)
router.post('/recalculate-all', metricsController.recalculateAllMetrics);

module.exports = router;