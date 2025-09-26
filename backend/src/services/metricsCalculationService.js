const db = require('../config/database');
const logger = require('../config/logger');
const moment = require('moment');

class MetricsCalculationService {
  constructor() {
    // Keywords for conversion tracking
    this.bookingKeywords = [
      'бронирование', 'бронь', 'забронировать', 'заказ', 'резерв',
      'booking', 'reserve', 'book', 'order'
    ];

    this.paymentKeywords = [
      'оплата', 'оплатить', 'платеж', 'купить', 'заплатить', 'стоимость',
      'цена', 'руб', 'рубл', 'доллар', 'евро', 'карт', 'перевод',
      'payment', 'pay', 'price', 'cost', 'buy', 'purchase', 'card'
    ];

    this.upsellKeywords = [
      'дополнительно', 'также предлагаем', 'рекомендуем', 'акция', 'скидка',
      'upgrade', 'дополнительные услуги', 'завтрак', 'трансфер', 'экскурсия'
    ];

    this.complaintKeywords = [
      'жалоба', 'недоволен', 'плохо', 'ужасно', 'проблема', 'некачественно',
      'complaint', 'problem', 'issue', 'dissatisfied', 'terrible', 'awful'
    ];
  }

  async calculateConversationMetrics(conversationId) {
    try {
      logger.info(`Calculating metrics for conversation: ${conversationId}`);

      const conversation = await this.getConversationData(conversationId);
      if (!conversation || !conversation.messages) {
        throw new Error('Conversation or messages not found');
      }

      const metrics = {
        conversation_id: conversationId,
        first_response_time_minutes: null,
        avg_response_time_minutes: null,
        total_response_time_minutes: null,
        message_count_incoming: 0,
        message_count_outgoing: 0,
        is_completed: false,
        has_booking_conversion: false,
        has_payment_conversion: false,
        has_upsell_attempt: false,
        avg_politeness_score: null,
        dominant_customer_sentiment: null
      };

      const messages = conversation.messages.sort((a, b) =>
        new Date(a.timestamp_normalized) - new Date(b.timestamp_normalized)
      );

      // Calculate message counts
      metrics.message_count_incoming = messages.filter(m => m.direction === 'incoming').length;
      metrics.message_count_outgoing = messages.filter(m => m.direction === 'outgoing').length;

      // Calculate first response time
      metrics.first_response_time_minutes = this.calculateFirstResponseTime(messages);

      // Calculate average response time
      metrics.avg_response_time_minutes = this.calculateAverageResponseTime(messages);

      // Calculate total conversation time
      metrics.total_response_time_minutes = this.calculateTotalConversationTime(messages);

      // Check for conversions and upsells
      metrics.has_booking_conversion = this.checkConversion(messages, this.bookingKeywords);
      metrics.has_payment_conversion = this.checkConversion(messages, this.paymentKeywords);
      metrics.has_upsell_attempt = this.checkUpsell(messages);

      // Determine if conversation is completed
      metrics.is_completed = this.isConversationCompleted(messages, conversation.status);

      // Get AI analysis data if available
      const aiData = await this.getAIAnalysisData(conversationId);
      if (aiData) {
        metrics.avg_politeness_score = aiData.avg_politeness_score;
        metrics.dominant_customer_sentiment = aiData.dominant_sentiment;
      }

      return metrics;

    } catch (error) {
      logger.error(`Failed to calculate metrics for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  calculateFirstResponseTime(messages) {
    // Find first incoming message and first outgoing response
    const firstIncoming = messages.find(m => m.direction === 'incoming');
    if (!firstIncoming) return null;

    const firstOutgoing = messages.find(m =>
      m.direction === 'outgoing' &&
      new Date(m.timestamp_normalized) > new Date(firstIncoming.timestamp_normalized)
    );

    if (!firstOutgoing) return null;

    const responseTime = moment(firstOutgoing.timestamp_normalized)
      .diff(moment(firstIncoming.timestamp_normalized), 'minutes', true);

    return Math.max(0, Math.round(responseTime * 100) / 100);
  }

  calculateAverageResponseTime(messages) {
    const responseTimes = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];

      // Look for incoming -> outgoing pattern
      if (currentMsg.direction === 'incoming' && nextMsg.direction === 'outgoing') {
        const responseTime = moment(nextMsg.timestamp_normalized)
          .diff(moment(currentMsg.timestamp_normalized), 'minutes', true);

        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    }

    if (responseTimes.length === 0) return null;

    const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avgTime * 100) / 100;
  }

  calculateTotalConversationTime(messages) {
    if (messages.length < 2) return null;

    const startTime = moment(messages[0].timestamp_normalized);
    const endTime = moment(messages[messages.length - 1].timestamp_normalized);

    const totalMinutes = endTime.diff(startTime, 'minutes');
    return Math.max(0, totalMinutes);
  }

  checkConversion(messages, keywords) {
    const content = messages
      .map(m => m.content.toLowerCase())
      .join(' ');

    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  checkUpsell(messages) {
    // Look for upsell patterns in outgoing messages
    const outgoingMessages = messages
      .filter(m => m.direction === 'outgoing')
      .map(m => m.content.toLowerCase())
      .join(' ');

    return this.upsellKeywords.some(keyword =>
      outgoingMessages.includes(keyword.toLowerCase())
    );
  }

  isConversationCompleted(messages, status) {
    // Check if conversation has closed status
    if (status === 'closed' || status === 'resolved') {
      return true;
    }

    // Check for completion indicators in messages
    const lastFewMessages = messages.slice(-3)
      .map(m => m.content.toLowerCase())
      .join(' ');

    const completionIndicators = [
      'спасибо', 'благодарю', 'всего доброго', 'до свидания',
      'решено', 'понятно', 'хорошо', 'отлично',
      'thank you', 'thanks', 'goodbye', 'bye', 'solved', 'resolved'
    ];

    const hasCompletionIndicator = completionIndicators.some(indicator =>
      lastFewMessages.includes(indicator)
    );

    // Check time gap - if last message is more than 24 hours ago, consider completed
    const lastMessage = messages[messages.length - 1];
    const hoursGap = moment().diff(moment(lastMessage.timestamp_normalized), 'hours');

    return hasCompletionIndicator || hoursGap > 24;
  }

  async getConversationData(conversationId) {
    const query = `
      SELECT
        c.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'content', m.content,
            'direction', m.direction,
            'timestamp_normalized', m.timestamp_normalized,
            'participant_is_business', p.is_business
          ) ORDER BY m.timestamp_normalized
        ) as messages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      LEFT JOIN participants p ON m.participant_id = p.id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async getAIAnalysisData(conversationId) {
    const query = `
      SELECT
        AVG(CASE WHEN ai.politeness_score IS NOT NULL THEN ai.politeness_score END) as avg_politeness_score,
        MODE() WITHIN GROUP (ORDER BY ai.sentiment) as dominant_sentiment
      FROM ai_analysis ai
      INNER JOIN messages m ON ai.message_id = m.id
      WHERE m.conversation_id = $1
        AND m.direction = 'incoming'
    `;

    const result = await db.query(query, [conversationId]);
    const row = result.rows[0];

    if (!row || row.avg_politeness_score === null) {
      return null;
    }

    return {
      avg_politeness_score: Math.round(parseFloat(row.avg_politeness_score) * 100) / 100,
      dominant_sentiment: row.dominant_sentiment
    };
  }

  async saveConversationMetrics(metrics) {
    try {
      // Check if metrics already exist
      const existingQuery = 'SELECT id FROM conversation_metrics WHERE conversation_id = $1';
      const existing = await db.query(existingQuery, [metrics.conversation_id]);

      let result;
      if (existing.rows.length > 0) {
        // Update existing metrics
        const updateQuery = `
          UPDATE conversation_metrics SET
            first_response_time_minutes = $2,
            avg_response_time_minutes = $3,
            total_response_time_minutes = $4,
            message_count_incoming = $5,
            message_count_outgoing = $6,
            is_completed = $7,
            has_booking_conversion = $8,
            has_payment_conversion = $9,
            has_upsell_attempt = $10,
            avg_politeness_score = $11,
            dominant_customer_sentiment = $12,
            calculated_at = NOW(),
            updated_at = NOW()
          WHERE conversation_id = $1
          RETURNING *
        `;

        result = await db.query(updateQuery, [
          metrics.conversation_id,
          metrics.first_response_time_minutes,
          metrics.avg_response_time_minutes,
          metrics.total_response_time_minutes,
          metrics.message_count_incoming,
          metrics.message_count_outgoing,
          metrics.is_completed,
          metrics.has_booking_conversion,
          metrics.has_payment_conversion,
          metrics.has_upsell_attempt,
          metrics.avg_politeness_score,
          metrics.dominant_customer_sentiment
        ]);
      } else {
        // Insert new metrics
        const insertQuery = `
          INSERT INTO conversation_metrics (
            conversation_id, first_response_time_minutes, avg_response_time_minutes,
            total_response_time_minutes, message_count_incoming, message_count_outgoing,
            is_completed, has_booking_conversion, has_payment_conversion,
            has_upsell_attempt, avg_politeness_score, dominant_customer_sentiment,
            calculated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          RETURNING *
        `;

        result = await db.query(insertQuery, [
          metrics.conversation_id,
          metrics.first_response_time_minutes,
          metrics.avg_response_time_minutes,
          metrics.total_response_time_minutes,
          metrics.message_count_incoming,
          metrics.message_count_outgoing,
          metrics.is_completed,
          metrics.has_booking_conversion,
          metrics.has_payment_conversion,
          metrics.has_upsell_attempt,
          metrics.avg_politeness_score,
          metrics.dominant_customer_sentiment
        ]);
      }

      logger.info(`Saved metrics for conversation ${metrics.conversation_id}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`Failed to save metrics for conversation ${metrics.conversation_id}:`, error);
      throw error;
    }
  }

  async calculateAndSaveMetrics(conversationId) {
    try {
      const metrics = await this.calculateConversationMetrics(conversationId);
      const savedMetrics = await this.saveConversationMetrics(metrics);
      return savedMetrics;
    } catch (error) {
      logger.error(`Failed to calculate and save metrics for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  async recalculateAllMetrics() {
    try {
      logger.info('Starting recalculation of all conversation metrics');

      const conversationsQuery = 'SELECT id FROM conversations ORDER BY created_at';
      const conversations = await db.query(conversationsQuery);

      let processed = 0;
      let errors = 0;

      for (const conversation of conversations.rows) {
        try {
          await this.calculateAndSaveMetrics(conversation.id);
          processed++;

          if (processed % 10 === 0) {
            logger.info(`Processed ${processed}/${conversations.rows.length} conversations`);
          }
        } catch (error) {
          errors++;
          logger.error(`Failed to process conversation ${conversation.id}:`, error.message);
        }
      }

      const summary = {
        total: conversations.rows.length,
        processed,
        errors
      };

      logger.info('Metrics recalculation completed:', summary);
      return summary;

    } catch (error) {
      logger.error('Failed to recalculate metrics:', error);
      throw error;
    }
  }
}

module.exports = new MetricsCalculationService();