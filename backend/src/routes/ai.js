const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI Configuration and Status
router.get('/config', aiController.getAIConfig);
router.get('/test-connection', aiController.testConnection);

// Message Analysis
router.post('/analyze/message/:messageId', aiController.analyzeMessage);
router.post('/analyze/conversation/:conversationId', aiController.analyzeConversation);
router.post('/analyze/pending', aiController.analyzePendingMessages);

// Analysis Retrieval
router.get('/analysis/intention/:intention', aiController.getAnalysisByIntention);
router.get('/analysis/politeness-trends', aiController.getPolitenessTrends);
router.get('/analysis/sentiment', aiController.getSentimentAnalysis);
router.get('/analysis/stats', aiController.getAnalysisStats);

// Insights Generation and Management
router.post('/insights/generate', aiController.generateInsights);
router.get('/insights', aiController.getInsights);
router.patch('/insights/:insightId/addressed', aiController.markInsightAsAddressed);

module.exports = router;