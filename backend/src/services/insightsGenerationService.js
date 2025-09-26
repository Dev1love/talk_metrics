const db = require('../config/database');
const logger = require('../config/logger');
const openAI = require('../config/openai');

class InsightsGenerationService {
  constructor() {
    // Insight categories and their weights
    this.insightCategories = {
      response_time: {
        weight: 0.25,
        thresholds: {
          critical: { firstResponse: 60, avgResponse: 90 },
          high: { firstResponse: 30, avgResponse: 45 },
          medium: { firstResponse: 15, avgResponse: 20 }
        }
      },
      politeness: {
        weight: 0.20,
        thresholds: {
          critical: 0.3,
          high: 0.5,
          medium: 0.7
        }
      },
      conversion: {
        weight: 0.15,
        thresholds: {
          excellent: 0.3,
          good: 0.2,
          average: 0.1
        }
      },
      completion: {
        weight: 0.20,
        thresholds: {
          critical: 0.4,
          high: 0.6,
          medium: 0.8
        }
      },
      sentiment: {
        weight: 0.20,
        thresholds: {
          critical: 0.3, // 30% negative sentiment
          high: 0.5,
          medium: 0.7
        }
      }
    };

    this.insightTemplates = {
      slow_response: {
        title: "Медленное время ответа",
        category: "response_time",
        template: "Время первого ответа составляет {firstResponseTime} минут, что превышает стандарт {threshold} минут на {difference} минут"
      },
      excellent_response: {
        title: "Отличное время ответа",
        category: "response_time",
        template: "Время первого ответа {firstResponseTime} минут - это отличный показатель, значительно лучше среднего"
      },
      low_politeness: {
        title: "Низкий уровень вежливости",
        category: "politeness",
        template: "Средний уровень вежливости {politenessScore} ниже приемлемого уровня {threshold}"
      },
      high_conversion: {
        title: "Высокая конверсия",
        category: "conversion",
        template: "Конверсия в {conversionType} составляет {rate}% - отличный результат"
      },
      missed_opportunities: {
        title: "Упущенные возможности",
        category: "conversion",
        template: "Обнаружено {count} диалогов без предложения дополнительных услуг при наличии возможности"
      },
      negative_sentiment: {
        title: "Негативные отзывы клиентов",
        category: "sentiment",
        template: "Доля негативных сообщений составляет {percentage}%, требуется внимание к качеству сервиса"
      },
      complaint_handling: {
        title: "Обработка жалоб",
        category: "sentiment",
        template: "Обнаружено {count} жалоб со средним временем реакции {responseTime} минут"
      },
      incomplete_conversations: {
        title: "Незавершенные диалоги",
        category: "completion",
        template: "Процент незавершенных диалогов составляет {percentage}%, что указывает на проблемы с качеством обслуживания"
      }
    };
  }

  async generateInsights(conversationId = null, dateRange = null) {
    try {
      logger.info('Generating insights', { conversationId, dateRange });

      const insights = [];

      if (conversationId) {
        // Generate insights for specific conversation
        const conversationInsights = await this.generateConversationInsights(conversationId);
        insights.push(...conversationInsights);
      } else {
        // Generate global insights
        const globalInsights = await this.generateGlobalInsights(dateRange);
        insights.push(...globalInsights);
      }

      // Save insights to database
      const savedInsights = await this.saveInsights(insights);

      logger.info(`Generated ${savedInsights.length} insights`);
      return savedInsights;

    } catch (error) {
      logger.error('Failed to generate insights:', error);
      throw error;
    }
  }

  async generateConversationInsights(conversationId) {
    const insights = [];

    try {
      // Get conversation data with metrics
      const conversation = await this.getConversationWithMetrics(conversationId);

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Response time insights
      const responseTimeInsights = await this.analyzeResponseTime(conversation);
      insights.push(...responseTimeInsights);

      // Politeness insights
      const politenessInsights = await this.analyzePoliteness(conversation);
      insights.push(...politenessInsights);

      // Conversion insights
      const conversionInsights = await this.analyzeConversions(conversation);
      insights.push(...conversionInsights);

      // Sentiment insights
      const sentimentInsights = await this.analyzeSentiment(conversation);
      insights.push(...sentimentInsights);

      return insights;

    } catch (error) {
      logger.error(`Failed to generate insights for conversation ${conversationId}:`, error);
      return [];
    }
  }

  async generateGlobalInsights(dateRange) {
    const insights = [];

    try {
      // Get aggregated metrics
      const metrics = await this.getAggregatedMetrics(dateRange);

      // Response time insights
      if (metrics.avg_first_response_minutes > this.insightCategories.response_time.thresholds.medium.firstResponse) {
        insights.push(await this.createResponseTimeInsight(metrics));
      }

      // Politeness insights
      if (metrics.avg_politeness_score < this.insightCategories.politeness.thresholds.medium) {
        insights.push(await this.createPolitenessInsight(metrics));
      }

      // Conversion insights
      insights.push(...await this.createConversionInsights(metrics));

      // Completion insights
      if (metrics.completion_rate < this.insightCategories.completion.thresholds.medium) {
        insights.push(await this.createCompletionInsight(metrics));
      }

      // Sentiment insights
      const sentimentData = await this.getSentimentData(dateRange);
      if (sentimentData.negative_percentage > 20) {
        insights.push(await this.createSentimentInsight(sentimentData));
      }

      return insights;

    } catch (error) {
      logger.error('Failed to generate global insights:', error);
      return [];
    }
  }

  async analyzeResponseTime(conversation) {
    const insights = [];
    const metrics = conversation.metrics;

    if (!metrics) return insights;

    // First response time analysis
    if (metrics.first_response_time_minutes > this.insightCategories.response_time.thresholds.high.firstResponse) {
      const proof = await this.findFirstResponseProof(conversation.id);

      insights.push({
        title: this.insightTemplates.slow_response.title,
        description: this.insightTemplates.slow_response.template
          .replace('{firstResponseTime}', Math.round(metrics.first_response_time_minutes))
          .replace('{threshold}', this.insightCategories.response_time.thresholds.high.firstResponse)
          .replace('{difference}', Math.round(metrics.first_response_time_minutes - this.insightCategories.response_time.thresholds.high.firstResponse)),
        recommendation: "Настройте уведомления для более быстрого реагирования на новые сообщения",
        priority: metrics.first_response_time_minutes > this.insightCategories.response_time.thresholds.critical.firstResponse ? 'critical' : 'high',
        category: 'response_time',
        proof_message_id: proof?.message_id,
        proof_conversation_id: conversation.id,
        metric_impact: this.calculateResponseTimeImpact(metrics.first_response_time_minutes)
      });
    } else if (metrics.first_response_time_minutes <= 5) {
      // Positive insight for excellent response time
      insights.push({
        title: this.insightTemplates.excellent_response.title,
        description: this.insightTemplates.excellent_response.template
          .replace('{firstResponseTime}', Math.round(metrics.first_response_time_minutes)),
        recommendation: "Отличная работа! Продолжайте поддерживать такие стандарты времени ответа",
        priority: 'low',
        category: 'response_time',
        proof_conversation_id: conversation.id,
        metric_impact: 5.0
      });
    }

    return insights;
  }

  async analyzePoliteness(conversation) {
    const insights = [];
    const metrics = conversation.metrics;

    if (!metrics || !metrics.avg_politeness_score) return insights;

    if (metrics.avg_politeness_score < this.insightCategories.politeness.thresholds.medium) {
      const proof = await this.findLowPolitenesProof(conversation.id);

      insights.push({
        title: this.insightTemplates.low_politeness.title,
        description: this.insightTemplates.low_politeness.template
          .replace('{politenessScore}', metrics.avg_politeness_score.toFixed(2))
          .replace('{threshold}', this.insightCategories.politeness.thresholds.medium),
        recommendation: "Проведите тренинг по клиентскому сервису с акцентом на вежливое общение",
        priority: metrics.avg_politeness_score < this.insightCategories.politeness.thresholds.critical ? 'critical' : 'high',
        category: 'politeness',
        proof_message_id: proof?.message_id,
        proof_conversation_id: conversation.id,
        metric_impact: this.calculatePolitenessImpact(metrics.avg_politeness_score)
      });
    }

    return insights;
  }

  async analyzeConversions(conversation) {
    const insights = [];
    const metrics = conversation.metrics;

    if (!metrics) return insights;

    // High conversion insight
    if (metrics.has_booking_conversion && metrics.has_payment_conversion) {
      insights.push({
        title: this.insightTemplates.high_conversion.title,
        description: this.insightTemplates.high_conversion.template
          .replace('{conversionType}', 'бронирование и оплату')
          .replace('{rate}', '100'),
        recommendation: "Отличная работа! Используйте этот диалог как пример успешной конверсии",
        priority: 'low',
        category: 'conversion',
        proof_conversation_id: conversation.id,
        metric_impact: 10.0
      });
    }

    // Missed upsell opportunity
    if (metrics.has_payment_conversion && !metrics.has_upsell_attempt) {
      insights.push({
        title: this.insightTemplates.missed_opportunities.title,
        description: "В диалоге с оплатой не было предложено дополнительных услуг",
        recommendation: "При подтверждении оплаты предлагайте дополнительные услуги (завтрак, трансфер, экскурсии)",
        priority: 'medium',
        category: 'conversion',
        proof_conversation_id: conversation.id,
        metric_impact: 8.0
      });
    }

    return insights;
  }

  async analyzeSentiment(conversation) {
    const insights = [];

    try {
      const sentimentData = await this.getConversationSentiment(conversation.id);

      if (sentimentData.negative_count > 0) {
        const proof = await this.findNegativeSentimentProof(conversation.id);

        insights.push({
          title: this.insightTemplates.negative_sentiment.title,
          description: `В диалоге обнаружено ${sentimentData.negative_count} негативных сообщений`,
          recommendation: "Обратите внимание на причины недовольства клиента и предпримите меры по улучшению ситуации",
          priority: 'high',
          category: 'sentiment',
          proof_message_id: proof?.message_id,
          proof_conversation_id: conversation.id,
          metric_impact: 15.0
        });
      }

      return insights;

    } catch (error) {
      logger.error(`Failed to analyze sentiment for conversation ${conversation.id}:`, error);
      return [];
    }
  }

  // Helper methods for creating global insights

  async createResponseTimeInsight(metrics) {
    const proof = await this.findSlowResponseExample();

    return {
      title: "Среднее время ответа превышает норму",
      description: `Среднее время первого ответа ${Math.round(metrics.avg_first_response_minutes)} минут превышает рекомендуемые 15 минут`,
      recommendation: "Внедрите систему уведомлений и распределения нагрузки между операторами",
      priority: 'high',
      category: 'response_time',
      proof_message_id: proof?.message_id,
      proof_conversation_id: proof?.conversation_id,
      metric_impact: 20.0
    };
  }

  async createPolitenessInsight(metrics) {
    const proof = await this.findLowPolitenessExample();

    return {
      title: "Низкий общий уровень вежливости",
      description: `Средний показатель вежливости ${metrics.avg_politeness_score.toFixed(2)} требует улучшения`,
      recommendation: "Проведите корпоративный тренинг по культуре общения с клиентами",
      priority: 'high',
      category: 'politeness',
      proof_message_id: proof?.message_id,
      proof_conversation_id: proof?.conversation_id,
      metric_impact: 18.0
    };
  }

  async createConversionInsights(metrics) {
    const insights = [];

    if (metrics.booking_conversion_rate > 25) {
      insights.push({
        title: "Высокая конверсия в бронирование",
        description: `Конверсия в бронирование ${metrics.booking_conversion_rate.toFixed(1)}% - отличный результат`,
        recommendation: "Изучите успешные диалоги и применяйте лучшие практики в других случаях",
        priority: 'low',
        category: 'conversion',
        metric_impact: 5.0
      });
    }

    if (metrics.upsell_rate < 10 && metrics.booking_conversion_rate > 15) {
      insights.push({
        title: "Низкий уровень допродаж",
        description: `При высокой конверсии в бронирование (${metrics.booking_conversion_rate.toFixed(1)}%) уровень допродаж составляет только ${metrics.upsell_rate.toFixed(1)}%`,
        recommendation: "Обучите команду техникам допродаж и создайте чек-листы дополнительных услуг",
        priority: 'medium',
        category: 'conversion',
        metric_impact: 12.0
      });
    }

    return insights;
  }

  async createCompletionInsight(metrics) {
    return {
      title: "Высокий процент незавершенных диалогов",
      description: `Процент завершенных диалогов ${metrics.completion_rate.toFixed(1)}% ниже целевого показателя 80%`,
      recommendation: "Внедрите процедуры закрытия диалогов и отслеживания статуса запросов клиентов",
      priority: 'high',
      category: 'completion',
      metric_impact: 15.0
    };
  }

  async createSentimentInsight(sentimentData) {
    const proof = await this.findRecentNegativeExample();

    return {
      title: "Высокий уровень негативных отзывов",
      description: `Доля негативных сообщений составляет ${sentimentData.negative_percentage.toFixed(1)}%`,
      recommendation: "Проанализируйте основные причины недовольства и разработайте план улучшений",
      priority: 'critical',
      category: 'sentiment',
      proof_message_id: proof?.message_id,
      proof_conversation_id: proof?.conversation_id,
      metric_impact: 25.0
    };
  }

  // Database helper methods

  async getConversationWithMetrics(conversationId) {
    const query = `
      SELECT
        c.*,
        cm.*
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [conversationId]);
    const row = result.rows[0];

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      platform: row.platform,
      status: row.status,
      started_at: row.started_at,
      closed_at: row.closed_at,
      metrics: row.conversation_id ? {
        first_response_time_minutes: row.first_response_time_minutes,
        avg_response_time_minutes: row.avg_response_time_minutes,
        total_response_time_minutes: row.total_response_time_minutes,
        is_completed: row.is_completed,
        has_booking_conversion: row.has_booking_conversion,
        has_payment_conversion: row.has_payment_conversion,
        has_upsell_attempt: row.has_upsell_attempt,
        avg_politeness_score: row.avg_politeness_score
      } : null
    };
  }

  async getAggregatedMetrics(dateRange) {
    let whereClause = '';
    const params = [];

    if (dateRange) {
      whereClause = 'WHERE c.started_at >= $1 AND c.started_at <= $2';
      params.push(dateRange.start, dateRange.end);
    }

    const query = `
      SELECT
        COUNT(*) as total_conversations,
        AVG(cm.first_response_time_minutes) as avg_first_response_minutes,
        AVG(cm.avg_response_time_minutes) as avg_response_time_minutes,
        AVG(cm.avg_politeness_score) as avg_politeness_score,
        (COUNT(CASE WHEN cm.is_completed THEN 1 END) * 100.0 / COUNT(*)) as completion_rate,
        (COUNT(CASE WHEN cm.has_booking_conversion THEN 1 END) * 100.0 / COUNT(*)) as booking_conversion_rate,
        (COUNT(CASE WHEN cm.has_payment_conversion THEN 1 END) * 100.0 / COUNT(*)) as payment_conversion_rate,
        (COUNT(CASE WHEN cm.has_upsell_attempt THEN 1 END) * 100.0 / COUNT(*)) as upsell_rate
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      ${whereClause}
    `;

    const result = await db.query(query, params);
    return result.rows[0];
  }

  async getSentimentData(dateRange) {
    let whereClause = '';
    const params = [];

    if (dateRange) {
      whereClause = 'AND m.timestamp_normalized >= $1 AND m.timestamp_normalized <= $2';
      params.push(dateRange.start, dateRange.end);
    }

    const query = `
      SELECT
        COUNT(CASE WHEN ai.sentiment = 'negative' THEN 1 END) as negative_count,
        COUNT(CASE WHEN ai.sentiment = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN ai.sentiment = 'neutral' THEN 1 END) as neutral_count,
        COUNT(*) as total_count,
        (COUNT(CASE WHEN ai.sentiment = 'negative' THEN 1 END) * 100.0 / COUNT(*)) as negative_percentage
      FROM ai_analysis ai
      INNER JOIN messages m ON ai.message_id = m.id
      WHERE m.direction = 'incoming' ${whereClause}
    `;

    const result = await db.query(query, params);
    return result.rows[0];
  }

  async getConversationSentiment(conversationId) {
    const query = `
      SELECT
        COUNT(CASE WHEN ai.sentiment = 'negative' THEN 1 END) as negative_count,
        COUNT(CASE WHEN ai.sentiment = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN ai.sentiment = 'neutral' THEN 1 END) as neutral_count
      FROM ai_analysis ai
      INNER JOIN messages m ON ai.message_id = m.id
      WHERE m.conversation_id = $1 AND m.direction = 'incoming'
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  // Proof finding methods

  async findFirstResponseProof(conversationId) {
    const query = `
      SELECT m.id as message_id
      FROM messages m
      WHERE m.conversation_id = $1 AND m.direction = 'outgoing'
      ORDER BY m.timestamp_normalized ASC
      LIMIT 1
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async findLowPolitenesProof(conversationId) {
    const query = `
      SELECT m.id as message_id
      FROM messages m
      INNER JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.conversation_id = $1
        AND m.direction = 'outgoing'
        AND ai.politeness_score IS NOT NULL
      ORDER BY ai.politeness_score ASC
      LIMIT 1
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async findNegativeSentimentProof(conversationId) {
    const query = `
      SELECT m.id as message_id
      FROM messages m
      INNER JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.conversation_id = $1
        AND m.direction = 'incoming'
        AND ai.sentiment = 'negative'
      ORDER BY m.timestamp_normalized ASC
      LIMIT 1
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async findSlowResponseExample() {
    const query = `
      SELECT
        m.id as message_id,
        c.id as conversation_id
      FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      INNER JOIN conversation_metrics cm ON c.id = cm.conversation_id
      WHERE m.direction = 'outgoing'
        AND cm.first_response_time_minutes > 30
      ORDER BY cm.first_response_time_minutes DESC
      LIMIT 1
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async findLowPolitenessExample() {
    const query = `
      SELECT
        m.id as message_id,
        m.conversation_id as conversation_id
      FROM messages m
      INNER JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.direction = 'outgoing'
        AND ai.politeness_score < 0.5
      ORDER BY ai.politeness_score ASC
      LIMIT 1
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async findRecentNegativeExample() {
    const query = `
      SELECT
        m.id as message_id,
        m.conversation_id as conversation_id
      FROM messages m
      INNER JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.direction = 'incoming'
        AND ai.sentiment = 'negative'
        AND m.timestamp_normalized >= NOW() - INTERVAL '7 days'
      ORDER BY m.timestamp_normalized DESC
      LIMIT 1
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  // Impact calculation methods

  calculateResponseTimeImpact(responseTimeMinutes) {
    const standardTime = 15;
    const overtime = Math.max(0, responseTimeMinutes - standardTime);
    return Math.min(25, overtime * 0.5);
  }

  calculatePolitenessImpact(politenessScore) {
    const standardScore = 0.7;
    const deficit = Math.max(0, standardScore - politenessScore);
    return Math.min(20, deficit * 50);
  }

  // Save insights to database

  async saveInsights(insights) {
    const savedInsights = [];

    for (const insight of insights) {
      try {
        const query = `
          INSERT INTO insights (
            title, description, recommendation, priority, category,
            proof_message_id, proof_conversation_id, metric_impact,
            generated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `;

        const result = await db.query(query, [
          insight.title,
          insight.description,
          insight.recommendation,
          insight.priority,
          insight.category,
          insight.proof_message_id || null,
          insight.proof_conversation_id || null,
          insight.metric_impact || 0
        ]);

        savedInsights.push(result.rows[0]);
      } catch (error) {
        logger.error('Failed to save insight:', error);
      }
    }

    return savedInsights;
  }

  async getInsights(filters = {}) {
    let whereClause = '';
    const params = [];
    let paramCount = 0;

    if (filters.category) {
      whereClause += ` AND category = $${++paramCount}`;
      params.push(filters.category);
    }

    if (filters.priority) {
      whereClause += ` AND priority = $${++paramCount}`;
      params.push(filters.priority);
    }

    if (filters.isAddressed !== undefined) {
      whereClause += ` AND is_addressed = $${++paramCount}`;
      params.push(filters.isAddressed);
    }

    const query = `
      SELECT
        i.*,
        m.content as proof_message_content,
        c.title as proof_conversation_title
      FROM insights i
      LEFT JOIN messages m ON i.proof_message_id = m.id
      LEFT JOIN conversations c ON i.proof_conversation_id = c.id
      WHERE 1=1 ${whereClause}
      ORDER BY i.generated_at DESC
      LIMIT ${filters.limit || 50}
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  async markInsightAsAddressed(insightId) {
    const query = `
      UPDATE insights
      SET is_addressed = true, addressed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [insightId]);
    return result.rows[0];
  }
}

module.exports = new InsightsGenerationService();