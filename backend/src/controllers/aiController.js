const aiAnalysisService = require('../services/aiAnalysisService');
const insightsGenerationService = require('../services/insightsGenerationService');
const openAI = require('../config/openai');
const logger = require('../config/logger');

class AIController {
  async analyzeMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { forceReanalysis = false } = req.query;

      const analysis = await aiAnalysisService.analyzeMessage(messageId, forceReanalysis === 'true');

      res.json({
        success: true,
        data: { analysis }
      });

    } catch (error) {
      logger.error(`Failed to analyze message ${req.params.messageId}:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to analyze message' }
      });
    }
  }

  async analyzeConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { forceReanalysis = false } = req.query;

      const summary = await aiAnalysisService.analyzeConversation(conversationId, forceReanalysis === 'true');

      res.json({
        success: true,
        data: { summary }
      });

    } catch (error) {
      logger.error(`Failed to analyze conversation ${req.params.conversationId}:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to analyze conversation' }
      });
    }
  }

  async analyzePendingMessages(req, res) {
    try {
      const summary = await aiAnalysisService.analyzePendingMessages();

      res.json({
        success: true,
        data: {
          message: 'Pending messages analysis completed',
          summary
        }
      });

    } catch (error) {
      logger.error('Failed to analyze pending messages:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to analyze pending messages' }
      });
    }
  }

  async getAnalysisByIntention(req, res) {
    try {
      const { intention } = req.params;
      const { limit = 50 } = req.query;

      const results = await aiAnalysisService.getAnalysisByIntention(intention, parseInt(limit));

      res.json({
        success: true,
        data: {
          intention,
          results,
          count: results.length
        }
      });

    } catch (error) {
      logger.error(`Failed to get analysis by intention ${req.params.intention}:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve analysis by intention' }
      });
    }
  }

  async getPolitenessTrends(req, res) {
    try {
      const { days = 30 } = req.query;

      const trends = await aiAnalysisService.getPolitenessTrends(parseInt(days));

      res.json({
        success: true,
        data: {
          trends,
          period: `${days} days`
        }
      });

    } catch (error) {
      logger.error('Failed to get politeness trends:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve politeness trends' }
      });
    }
  }

  async getSentimentAnalysis(req, res) {
    try {
      const { conversationId } = req.query;

      const analysis = await aiAnalysisService.getSentimentAnalysis(conversationId);

      res.json({
        success: true,
        data: {
          sentimentAnalysis: analysis,
          conversationId: conversationId || 'global'
        }
      });

    } catch (error) {
      logger.error('Failed to get sentiment analysis:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve sentiment analysis' }
      });
    }
  }

  async getAnalysisStats(req, res) {
    try {
      const stats = await aiAnalysisService.getAnalysisStats();

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Failed to get analysis stats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve analysis statistics' }
      });
    }
  }

  async generateInsights(req, res) {
    try {
      const { conversationId, dateRange } = req.query;

      let range = null;
      if (dateRange) {
        const [start, end] = dateRange.split(',');
        range = {
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString()
        };
      }

      const insights = await insightsGenerationService.generateInsights(conversationId, range);

      res.json({
        success: true,
        data: {
          insights,
          count: insights.length,
          conversationId: conversationId || 'global',
          dateRange: range
        }
      });

    } catch (error) {
      logger.error('Failed to generate insights:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate insights' }
      });
    }
  }

  async getInsights(req, res) {
    try {
      const {
        category,
        priority,
        isAddressed,
        limit = 50
      } = req.query;

      const filters = {
        category,
        priority,
        isAddressed: isAddressed !== undefined ? isAddressed === 'true' : undefined,
        limit: parseInt(limit)
      };

      const insights = await insightsGenerationService.getInsights(filters);

      res.json({
        success: true,
        data: {
          insights,
          count: insights.length,
          filters
        }
      });

    } catch (error) {
      logger.error('Failed to get insights:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve insights' }
      });
    }
  }

  async markInsightAsAddressed(req, res) {
    try {
      const { insightId } = req.params;

      const insight = await insightsGenerationService.markInsightAsAddressed(insightId);

      if (!insight) {
        return res.status(404).json({
          success: false,
          error: { message: 'Insight not found' }
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Insight marked as addressed',
          insight
        }
      });

    } catch (error) {
      logger.error(`Failed to mark insight ${req.params.insightId} as addressed:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update insight status' }
      });
    }
  }

  async testConnection(req, res) {
    try {
      const isEnabled = openAI.isEnabled;

      if (!isEnabled) {
        return res.status(503).json({
          success: false,
          error: { message: 'OpenAI API not configured' }
        });
      }

      await openAI.testConnection();

      res.json({
        success: true,
        data: {
          message: 'OpenAI connection test successful',
          config: openAI.getUsageStats()
        }
      });

    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      res.status(503).json({
        success: false,
        error: { message: 'OpenAI connection test failed' }
      });
    }
  }

  async getAIConfig(req, res) {
    try {
      const config = openAI.getUsageStats();

      res.json({
        success: true,
        data: { config }
      });

    } catch (error) {
      logger.error('Failed to get AI configuration:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve AI configuration' }
      });
    }
  }
}

module.exports = new AIController();