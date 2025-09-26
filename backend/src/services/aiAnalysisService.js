const openAI = require('../config/openai');
const db = require('../config/database');
const logger = require('../config/logger');

class AIAnalysisService {
  constructor() {
    this.analysisQueue = [];
    this.isProcessing = false;
    this.batchSize = 5;
    this.rateLimitDelay = 1000; // 1 second between batches
  }

  async analyzeMessage(messageId, forceReanalysis = false) {
    try {
      // Check if analysis already exists
      if (!forceReanalysis) {
        const existing = await this.getExistingAnalysis(messageId);
        if (existing) {
          logger.info(`Analysis already exists for message ${messageId}`);
          return existing;
        }
      }

      // Get message data
      const message = await this.getMessageData(messageId);
      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      // Perform AI analysis
      const analysis = await openAI.analyzeMessage(message, 'full');

      // Save results to database
      const savedAnalysis = await this.saveAnalysisResults(messageId, analysis);

      logger.info(`AI analysis completed for message ${messageId}:`, {
        intention: analysis.intention,
        politeness: analysis.politeness_score,
        sentiment: analysis.sentiment
      });

      return savedAnalysis;

    } catch (error) {
      logger.error(`Failed to analyze message ${messageId}:`, error);
      throw error;
    }
  }

  async analyzeConversation(conversationId, forceReanalysis = false) {
    try {
      logger.info(`Starting AI analysis for conversation ${conversationId}`);

      // Get messages for conversation
      const messages = await this.getConversationMessages(conversationId);

      if (!messages || messages.length === 0) {
        throw new Error(`No messages found for conversation ${conversationId}`);
      }

      // Filter messages that need analysis
      let messagesToAnalyze = messages;
      if (!forceReanalysis) {
        messagesToAnalyze = await this.filterUnanalyzedMessages(messages);
      }

      if (messagesToAnalyze.length === 0) {
        logger.info(`All messages in conversation ${conversationId} already analyzed`);
        return await this.getConversationAnalysisSummary(conversationId);
      }

      logger.info(`Analyzing ${messagesToAnalyze.length} messages in conversation ${conversationId}`);

      // Perform batch analysis
      const batchResult = await openAI.analyzeBatch(messagesToAnalyze, 'full', this.batchSize);

      // Save successful results
      const savedResults = [];
      for (const result of batchResult.results) {
        try {
          const saved = await this.saveAnalysisResults(result.messageId, result.analysis);
          savedResults.push(saved);
        } catch (error) {
          logger.error(`Failed to save analysis for message ${result.messageId}:`, error);
        }
      }

      // Update conversation metrics with AI data
      await this.updateConversationMetricsWithAI(conversationId);

      const summary = {
        conversationId,
        totalMessages: messages.length,
        analyzedMessages: savedResults.length,
        errors: batchResult.errors.length,
        successRate: batchResult.summary.successRate
      };

      logger.info(`Conversation analysis completed:`, summary);
      return summary;

    } catch (error) {
      logger.error(`Failed to analyze conversation ${conversationId}:`, error);
      throw error;
    }
  }

  async analyzePendingMessages() {
    try {
      logger.info('Starting analysis of pending messages');

      // Get messages without AI analysis
      const pendingMessages = await this.getPendingMessages();

      if (pendingMessages.length === 0) {
        logger.info('No pending messages for AI analysis');
        return { processed: 0, errors: 0 };
      }

      logger.info(`Found ${pendingMessages.length} messages pending AI analysis`);

      // Process in batches
      let totalProcessed = 0;
      let totalErrors = 0;

      for (let i = 0; i < pendingMessages.length; i += this.batchSize) {
        const batch = pendingMessages.slice(i, i + this.batchSize);

        try {
          const batchResult = await openAI.analyzeBatch(batch, 'full', this.batchSize);

          // Save results
          for (const result of batchResult.results) {
            try {
              await this.saveAnalysisResults(result.messageId, result.analysis);
              totalProcessed++;
            } catch (error) {
              logger.error(`Failed to save analysis for message ${result.messageId}:`, error);
              totalErrors++;
            }
          }

          totalErrors += batchResult.errors.length;

          // Rate limiting delay
          if (i + this.batchSize < pendingMessages.length) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
          }

        } catch (error) {
          logger.error('Batch processing failed:', error);
          totalErrors += batch.length;
        }
      }

      const summary = {
        total: pendingMessages.length,
        processed: totalProcessed,
        errors: totalErrors
      };

      logger.info('Pending messages analysis completed:', summary);
      return summary;

    } catch (error) {
      logger.error('Failed to analyze pending messages:', error);
      throw error;
    }
  }

  async getAnalysisByIntention(intention, limit = 50) {
    try {
      const query = `
        SELECT
          ai.*,
          m.content,
          m.direction,
          m.timestamp_normalized,
          c.title as conversation_title,
          p.name as participant_name
        FROM ai_analysis ai
        INNER JOIN messages m ON ai.message_id = m.id
        INNER JOIN conversations c ON m.conversation_id = c.id
        INNER JOIN participants p ON m.participant_id = p.id
        WHERE ai.intention = $1
        ORDER BY ai.processed_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [intention, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to get analysis by intention ${intention}:`, error);
      throw error;
    }
  }

  async getPolitenessTrends(days = 30) {
    try {
      const query = `
        SELECT
          DATE(m.timestamp_normalized) as date,
          AVG(ai.politeness_score) as avg_politeness,
          COUNT(*) as message_count,
          m.direction
        FROM ai_analysis ai
        INNER JOIN messages m ON ai.message_id = m.id
        WHERE m.timestamp_normalized >= NOW() - INTERVAL '${days} days'
          AND ai.politeness_score IS NOT NULL
        GROUP BY DATE(m.timestamp_normalized), m.direction
        ORDER BY date DESC, direction
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get politeness trends:', error);
      throw error;
    }
  }

  async getSentimentAnalysis(conversationId = null) {
    try {
      let query = `
        SELECT
          ai.sentiment,
          COUNT(*) as count,
          AVG(ai.sentiment_confidence) as avg_confidence
        FROM ai_analysis ai
      `;

      const params = [];
      if (conversationId) {
        query += `
          INNER JOIN messages m ON ai.message_id = m.id
          WHERE m.conversation_id = $1
        `;
        params.push(conversationId);
      }

      query += `
        GROUP BY ai.sentiment
        ORDER BY count DESC
      `;

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get sentiment analysis:', error);
      throw error;
    }
  }

  // Helper methods

  async getExistingAnalysis(messageId) {
    const query = 'SELECT * FROM ai_analysis WHERE message_id = $1';
    const result = await db.query(query, [messageId]);
    return result.rows[0];
  }

  async getMessageData(messageId) {
    const query = `
      SELECT
        m.*,
        p.is_business
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      WHERE m.id = $1
    `;
    const result = await db.query(query, [messageId]);
    return result.rows[0];
  }

  async getConversationMessages(conversationId) {
    const query = `
      SELECT
        m.*,
        p.is_business
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      WHERE m.conversation_id = $1
      ORDER BY m.timestamp_normalized ASC
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows;
  }

  async filterUnanalyzedMessages(messages) {
    const messageIds = messages.map(m => m.id);

    if (messageIds.length === 0) return [];

    const placeholders = messageIds.map((_, index) => `$${index + 1}`).join(', ');
    const query = `
      SELECT message_id
      FROM ai_analysis
      WHERE message_id IN (${placeholders})
    `;

    const result = await db.query(query, messageIds);
    const analyzedIds = new Set(result.rows.map(row => row.message_id));

    return messages.filter(m => !analyzedIds.has(m.id));
  }

  async getPendingMessages(limit = 100) {
    const query = `
      SELECT
        m.*,
        p.is_business
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      LEFT JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE ai.id IS NULL
        AND m.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY m.created_at ASC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  async saveAnalysisResults(messageId, analysis) {
    try {
      const query = `
        INSERT INTO ai_analysis (
          message_id, intention, intention_confidence,
          politeness_score, sentiment, sentiment_confidence,
          contains_keywords, ai_model, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (message_id)
        DO UPDATE SET
          intention = EXCLUDED.intention,
          intention_confidence = EXCLUDED.intention_confidence,
          politeness_score = EXCLUDED.politeness_score,
          sentiment = EXCLUDED.sentiment,
          sentiment_confidence = EXCLUDED.sentiment_confidence,
          contains_keywords = EXCLUDED.contains_keywords,
          ai_model = EXCLUDED.ai_model,
          processed_at = NOW()
        RETURNING *
      `;

      const result = await db.query(query, [
        messageId,
        analysis.intention || null,
        analysis.intention_confidence || null,
        analysis.politeness_score || null,
        analysis.sentiment || null,
        analysis.sentiment_confidence || null,
        analysis.keywords || [],
        openAI.model,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to save analysis results for message ${messageId}:`, error);
      throw error;
    }
  }

  async getConversationAnalysisSummary(conversationId) {
    const query = `
      SELECT
        COUNT(*) as total_messages,
        COUNT(ai.id) as analyzed_messages,
        AVG(ai.politeness_score) as avg_politeness,
        MODE() WITHIN GROUP (ORDER BY ai.sentiment) as dominant_sentiment,
        array_agg(DISTINCT ai.intention) FILTER (WHERE ai.intention IS NOT NULL) as intentions
      FROM messages m
      LEFT JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.conversation_id = $1
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async updateConversationMetricsWithAI(conversationId) {
    try {
      // This will be called by the metrics calculation service
      // to include AI analysis data in conversation metrics
      const metricsService = require('./metricsCalculationService');
      await metricsService.calculateAndSaveMetrics(conversationId);
    } catch (error) {
      logger.error(`Failed to update conversation metrics with AI data for ${conversationId}:`, error);
    }
  }

  async getAnalysisStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_analyzed,
          AVG(politeness_score) as avg_politeness,
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
          COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count,
          COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count,
          intention,
          COUNT(*) as intention_count
        FROM ai_analysis
        WHERE processed_at >= NOW() - INTERVAL '30 days'
        GROUP BY intention
        ORDER BY intention_count DESC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get analysis stats:', error);
      throw error;
    }
  }
}

module.exports = new AIAnalysisService();