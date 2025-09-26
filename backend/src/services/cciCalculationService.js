const db = require('../config/database');
const logger = require('../config/logger');

class CCICalculationService {
  constructor() {
    // Weights for different components of CCI (total should be 1.0)
    this.weights = {
      response_time: 0.25,        // 25% - Speed of response
      completion_rate: 0.20,      // 20% - Conversation completion
      conversion_rate: 0.15,      // 15% - Business conversions
      politeness: 0.20,          // 20% - Communication quality
      problem_resolution: 0.20    // 20% - Problem handling effectiveness
    };

    // Thresholds for scoring (these can be adjusted based on business requirements)
    this.thresholds = {
      first_response_minutes: {
        excellent: 5,    // <= 5 minutes = 100 points
        good: 15,        // <= 15 minutes = 80 points
        average: 30,     // <= 30 minutes = 60 points
        poor: 60         // <= 60 minutes = 40 points
        // > 60 minutes = 20 points
      },
      avg_response_minutes: {
        excellent: 10,
        good: 20,
        average: 45,
        poor: 90
      },
      completion_rate: {
        excellent: 90,   // >= 90% = 100 points
        good: 75,        // >= 75% = 80 points
        average: 60,     // >= 60% = 60 points
        poor: 40         // >= 40% = 40 points
        // < 40% = 20 points
      },
      conversion_rate: {
        excellent: 30,
        good: 20,
        average: 10,
        poor: 5
      },
      politeness_score: {
        excellent: 0.8,  // >= 0.8 = 100 points
        good: 0.6,       // >= 0.6 = 80 points
        average: 0.4,    // >= 0.4 = 60 points
        poor: 0.2        // >= 0.2 = 40 points
        // < 0.2 = 20 points
      }
    };
  }

  async calculateCCI(dateRange = null) {
    try {
      logger.info('Calculating Communication Quality Index (CCI)');

      // Get aggregated metrics
      const metrics = await this.getAggregatedMetrics(dateRange);

      if (!metrics || metrics.total_conversations === 0) {
        logger.warn('No conversations found for CCI calculation');
        return {
          cci_score: 0,
          components: {},
          metrics: {},
          message: 'No data available for CCI calculation'
        };
      }

      // Calculate component scores
      const components = {
        response_time_score: this.calculateResponseTimeScore(metrics),
        completion_rate_score: this.calculateCompletionRateScore(metrics),
        conversion_rate_score: this.calculateConversionRateScore(metrics),
        politeness_score: this.calculatePolitenessScore(metrics),
        problem_resolution_score: this.calculateProblemResolutionScore(metrics)
      };

      // Calculate weighted CCI score
      const cci_score = Math.round(
        (components.response_time_score * this.weights.response_time) +
        (components.completion_rate_score * this.weights.completion_rate) +
        (components.conversion_rate_score * this.weights.conversion_rate) +
        (components.politeness_score * this.weights.politeness) +
        (components.problem_resolution_score * this.weights.problem_resolution)
      );

      const result = {
        cci_score: Math.min(100, Math.max(0, cci_score)),
        components,
        metrics,
        weights: this.weights,
        dateRange: dateRange || 'all_time'
      };

      logger.info(`CCI calculated: ${result.cci_score}/100`, { components });
      return result;

    } catch (error) {
      logger.error('Failed to calculate CCI:', error);
      throw error;
    }
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
        COUNT(CASE WHEN cm.is_completed THEN 1 END) as completed_conversations,
        AVG(cm.first_response_time_minutes) as avg_first_response_minutes,
        AVG(cm.avg_response_time_minutes) as avg_response_time_minutes,
        AVG(cm.total_response_time_minutes) as avg_total_time_minutes,
        COUNT(CASE WHEN cm.has_booking_conversion THEN 1 END) as booking_conversions,
        COUNT(CASE WHEN cm.has_payment_conversion THEN 1 END) as payment_conversions,
        COUNT(CASE WHEN cm.has_upsell_attempt THEN 1 END) as upsell_attempts,
        AVG(cm.avg_politeness_score) as avg_politeness_score,
        COUNT(CASE WHEN cm.dominant_customer_sentiment = 'negative' THEN 1 END) as negative_sentiment_count
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      ${whereClause}
    `;

    const result = await db.query(query, params);
    const row = result.rows[0];

    return {
      total_conversations: parseInt(row.total_conversations) || 0,
      completed_conversations: parseInt(row.completed_conversations) || 0,
      avg_first_response_minutes: parseFloat(row.avg_first_response_minutes) || 0,
      avg_response_time_minutes: parseFloat(row.avg_response_time_minutes) || 0,
      avg_total_time_minutes: parseFloat(row.avg_total_time_minutes) || 0,
      booking_conversions: parseInt(row.booking_conversions) || 0,
      payment_conversions: parseInt(row.payment_conversions) || 0,
      upsell_attempts: parseInt(row.upsell_attempts) || 0,
      avg_politeness_score: parseFloat(row.avg_politeness_score) || 0,
      negative_sentiment_count: parseInt(row.negative_sentiment_count) || 0,

      // Calculated percentages
      completion_rate: row.total_conversations > 0 ?
        (parseInt(row.completed_conversations) / parseInt(row.total_conversations)) * 100 : 0,
      booking_conversion_rate: row.total_conversations > 0 ?
        (parseInt(row.booking_conversions) / parseInt(row.total_conversations)) * 100 : 0,
      payment_conversion_rate: row.total_conversations > 0 ?
        (parseInt(row.payment_conversions) / parseInt(row.total_conversations)) * 100 : 0,
      upsell_rate: row.total_conversations > 0 ?
        (parseInt(row.upsell_attempts) / parseInt(row.total_conversations)) * 100 : 0
    };
  }

  calculateResponseTimeScore(metrics) {
    const firstResponseScore = this.scoreByThreshold(
      metrics.avg_first_response_minutes,
      this.thresholds.first_response_minutes,
      'lower_is_better'
    );

    const avgResponseScore = this.scoreByThreshold(
      metrics.avg_response_time_minutes,
      this.thresholds.avg_response_minutes,
      'lower_is_better'
    );

    // Average of both response time scores
    return Math.round((firstResponseScore + avgResponseScore) / 2);
  }

  calculateCompletionRateScore(metrics) {
    return this.scoreByThreshold(
      metrics.completion_rate,
      this.thresholds.completion_rate,
      'higher_is_better'
    );
  }

  calculateConversionRateScore(metrics) {
    // Combine booking and payment conversion rates
    const totalConversionRate = (metrics.booking_conversion_rate + metrics.payment_conversion_rate) / 2;

    const conversionScore = this.scoreByThreshold(
      totalConversionRate,
      this.thresholds.conversion_rate,
      'higher_is_better'
    );

    // Bonus for upsell attempts
    const upsellBonus = Math.min(20, metrics.upsell_rate * 2); // Max 20 bonus points

    return Math.min(100, conversionScore + upsellBonus);
  }

  calculatePolitenessScore(metrics) {
    if (metrics.avg_politeness_score === 0) {
      return 50; // Default score if no politeness data
    }

    return this.scoreByThreshold(
      metrics.avg_politeness_score,
      this.thresholds.politeness_score,
      'higher_is_better'
    );
  }

  calculateProblemResolutionScore(metrics) {
    if (metrics.total_conversations === 0) return 50;

    // Score based on completion rate and negative sentiment handling
    const completionScore = (metrics.completion_rate / 100) * 60; // Up to 60 points for completion

    // Penalty for unresolved negative sentiment
    const negativeRate = (metrics.negative_sentiment_count / metrics.total_conversations) * 100;
    const sentimentScore = Math.max(0, 40 - negativeRate); // Up to 40 points, reduced by negative sentiment

    return Math.round(completionScore + sentimentScore);
  }

  scoreByThreshold(value, thresholds, direction) {
    if (value === null || value === undefined) return 50; // Default score

    if (direction === 'lower_is_better') {
      if (value <= thresholds.excellent) return 100;
      if (value <= thresholds.good) return 80;
      if (value <= thresholds.average) return 60;
      if (value <= thresholds.poor) return 40;
      return 20;
    } else { // higher_is_better
      if (value >= thresholds.excellent) return 100;
      if (value >= thresholds.good) return 80;
      if (value >= thresholds.average) return 60;
      if (value >= thresholds.poor) return 40;
      return 20;
    }
  }

  async saveCCIToDatabase(cciResult, dateRange = null) {
    try {
      const date = dateRange ? new Date(dateRange.end).toISOString().split('T')[0] :
                   new Date().toISOString().split('T')[0];

      // Check if record exists for this date
      const existingQuery = 'SELECT id FROM global_metrics WHERE metric_date = $1';
      const existing = await db.query(existingQuery, [date]);

      const metricsData = cciResult.metrics;

      if (existing.rows.length > 0) {
        // Update existing record
        const updateQuery = `
          UPDATE global_metrics SET
            total_conversations = $2,
            completed_conversations = $3,
            avg_first_response_minutes = $4,
            avg_response_time_minutes = $5,
            avg_closure_time_minutes = $6,
            completion_rate = $7,
            booking_conversion_rate = $8,
            payment_conversion_rate = $9,
            upsell_rate = $10,
            avg_politeness_score = $11,
            cci_score = $12,
            calculated_at = NOW(),
            updated_at = NOW()
          WHERE metric_date = $1
          RETURNING *
        `;

        const result = await db.query(updateQuery, [
          date,
          metricsData.total_conversations,
          metricsData.completed_conversations,
          metricsData.avg_first_response_minutes,
          metricsData.avg_response_time_minutes,
          metricsData.avg_total_time_minutes,
          metricsData.completion_rate,
          metricsData.booking_conversion_rate,
          metricsData.payment_conversion_rate,
          metricsData.upsell_rate,
          metricsData.avg_politeness_score,
          cciResult.cci_score
        ]);

        return result.rows[0];
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO global_metrics (
            metric_date, total_conversations, completed_conversations,
            avg_first_response_minutes, avg_response_time_minutes, avg_closure_time_minutes,
            completion_rate, booking_conversion_rate, payment_conversion_rate,
            upsell_rate, avg_politeness_score, cci_score, calculated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          RETURNING *
        `;

        const result = await db.query(insertQuery, [
          date,
          metricsData.total_conversations,
          metricsData.completed_conversations,
          metricsData.avg_first_response_minutes,
          metricsData.avg_response_time_minutes,
          metricsData.avg_total_time_minutes,
          metricsData.completion_rate,
          metricsData.booking_conversion_rate,
          metricsData.payment_conversion_rate,
          metricsData.upsell_rate,
          metricsData.avg_politeness_score,
          cciResult.cci_score
        ]);

        return result.rows[0];
      }
    } catch (error) {
      logger.error('Failed to save CCI to database:', error);
      throw error;
    }
  }

  async getCCIHistory(days = 30) {
    try {
      const query = `
        SELECT *
        FROM global_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY metric_date DESC
        LIMIT $1
      `;

      const result = await db.query(query, [days]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get CCI history:', error);
      throw error;
    }
  }

  getCCIInterpretation(score) {
    if (score >= 90) {
      return {
        level: 'Excellent',
        description: 'Outstanding communication quality. Team consistently exceeds expectations.',
        color: '#10B981', // green
        recommendations: ['Maintain current standards', 'Share best practices with other teams']
      };
    } else if (score >= 75) {
      return {
        level: 'Good',
        description: 'Good communication quality with room for minor improvements.',
        color: '#84CC16', // lime
        recommendations: ['Focus on response time optimization', 'Enhance conversion strategies']
      };
    } else if (score >= 60) {
      return {
        level: 'Average',
        description: 'Average performance. Several areas need improvement.',
        color: '#F59E0B', // amber
        recommendations: ['Improve first response times', 'Increase completion rates', 'Focus on customer satisfaction']
      };
    } else if (score >= 40) {
      return {
        level: 'Below Average',
        description: 'Performance is below standards. Immediate attention required.',
        color: '#EF4444', // red
        recommendations: ['Review response procedures', 'Implement quality training', 'Monitor conversations closely']
      };
    } else {
      return {
        level: 'Poor',
        description: 'Critical issues with communication quality. Urgent intervention needed.',
        color: '#DC2626', // dark red
        recommendations: ['Emergency quality review', 'Immediate training required', 'Consider process restructuring']
      };
    }
  }
}

module.exports = new CCICalculationService();