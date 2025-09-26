const metricsCalculationService = require('../services/metricsCalculationService');
const cciCalculationService = require('../services/cciCalculationService');
const logger = require('../config/logger');
const db = require('../config/database');

class MetricsController {
  async getGlobalMetrics(req, res) {
    try {
      const { dateRange, days = 30 } = req.query;

      let range = null;
      if (dateRange) {
        const [start, end] = dateRange.split(',');
        range = {
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString()
        };
      }

      // Calculate current CCI
      const cciResult = await cciCalculationService.calculateCCI(range);

      // Get CCI history
      const cciHistory = await cciCalculationService.getCCIHistory(parseInt(days));

      // Get CCI interpretation
      const interpretation = cciCalculationService.getCCIInterpretation(cciResult.cci_score);

      res.json({
        success: true,
        data: {
          current: {
            cci_score: cciResult.cci_score,
            metrics: cciResult.metrics,
            components: cciResult.components,
            interpretation
          },
          history: cciHistory,
          dateRange: cciResult.dateRange
        }
      });

    } catch (error) {
      logger.error('Failed to get global metrics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve global metrics' }
      });
    }
  }

  async getConversationMetrics(req, res) {
    try {
      const { conversationId } = req.params;

      // Get existing metrics or calculate new ones
      let metrics = await this.getExistingMetrics(conversationId);

      if (!metrics) {
        // Calculate and save new metrics
        metrics = await metricsCalculationService.calculateAndSaveMetrics(conversationId);
      }

      res.json({
        success: true,
        data: { metrics }
      });

    } catch (error) {
      logger.error(`Failed to get metrics for conversation ${req.params.conversationId}:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve conversation metrics' }
      });
    }
  }

  async recalculateConversationMetrics(req, res) {
    try {
      const { conversationId } = req.params;

      const metrics = await metricsCalculationService.calculateAndSaveMetrics(conversationId);

      res.json({
        success: true,
        data: {
          message: 'Metrics recalculated successfully',
          metrics
        }
      });

    } catch (error) {
      logger.error(`Failed to recalculate metrics for conversation ${req.params.conversationId}:`, error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to recalculate conversation metrics' }
      });
    }
  }

  async recalculateAllMetrics(req, res) {
    try {
      logger.info('Starting bulk metrics recalculation');

      const summary = await metricsCalculationService.recalculateAllMetrics();

      res.json({
        success: true,
        data: {
          message: 'Bulk metrics recalculation completed',
          summary
        }
      });

    } catch (error) {
      logger.error('Failed to recalculate all metrics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to recalculate all metrics' }
      });
    }
  }

  async calculateCCI(req, res) {
    try {
      const { dateRange, saveToDb = true } = req.query;

      let range = null;
      if (dateRange) {
        const [start, end] = dateRange.split(',');
        range = {
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString()
        };
      }

      const cciResult = await cciCalculationService.calculateCCI(range);

      // Save to database if requested
      if (saveToDb === 'true' || saveToDb === true) {
        await cciCalculationService.saveCCIToDatabase(cciResult, range);
      }

      const interpretation = cciCalculationService.getCCIInterpretation(cciResult.cci_score);

      res.json({
        success: true,
        data: {
          ...cciResult,
          interpretation
        }
      });

    } catch (error) {
      logger.error('Failed to calculate CCI:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to calculate Communication Quality Index' }
      });
    }
  }

  async getMetricsSummary(req, res) {
    try {
      const { platform, days = 7 } = req.query;

      const summary = await this.calculateMetricsSummary(platform, parseInt(days));

      res.json({
        success: true,
        data: { summary }
      });

    } catch (error) {
      logger.error('Failed to get metrics summary:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve metrics summary' }
      });
    }
  }

  async getResponseTimeAnalytics(req, res) {
    try {
      const { days = 30, groupBy = 'day' } = req.query;

      const analytics = await this.getResponseTimeData(parseInt(days), groupBy);

      res.json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      logger.error('Failed to get response time analytics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve response time analytics' }
      });
    }
  }

  async getConversionAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;

      const analytics = await this.getConversionData(parseInt(days));

      res.json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      logger.error('Failed to get conversion analytics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve conversion analytics' }
      });
    }
  }

  // Helper methods

  async getExistingMetrics(conversationId) {
    const query = 'SELECT * FROM conversation_metrics WHERE conversation_id = $1';
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async calculateMetricsSummary(platform, days) {
    let whereClause = `WHERE c.started_at >= NOW() - INTERVAL '${days} days'`;
    const params = [];

    if (platform) {
      whereClause += ' AND c.platform = $1';
      params.push(platform);
    }

    const query = `
      SELECT
        COUNT(c.id) as total_conversations,
        COUNT(CASE WHEN cm.is_completed THEN 1 END) as completed_conversations,
        AVG(cm.first_response_time_minutes) as avg_first_response,
        AVG(cm.avg_response_time_minutes) as avg_response_time,
        COUNT(CASE WHEN cm.has_booking_conversion THEN 1 END) as booking_conversions,
        COUNT(CASE WHEN cm.has_payment_conversion THEN 1 END) as payment_conversions,
        COUNT(CASE WHEN cm.has_upsell_attempt THEN 1 END) as upsell_attempts,
        AVG(cm.avg_politeness_score) as avg_politeness,
        c.platform
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      ${whereClause}
      ${platform ? '' : 'GROUP BY c.platform'}
      ORDER BY c.platform
    `;

    const result = await db.query(query, params);
    return result.rows.map(row => ({
      platform: row.platform,
      totalConversations: parseInt(row.total_conversations) || 0,
      completedConversations: parseInt(row.completed_conversations) || 0,
      completionRate: row.total_conversations > 0 ?
        ((parseInt(row.completed_conversations) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0,
      avgFirstResponse: parseFloat(row.avg_first_response)?.toFixed(1) || 0,
      avgResponseTime: parseFloat(row.avg_response_time)?.toFixed(1) || 0,
      bookingConversions: parseInt(row.booking_conversions) || 0,
      paymentConversions: parseInt(row.payment_conversions) || 0,
      upsellAttempts: parseInt(row.upsell_attempts) || 0,
      avgPoliteness: parseFloat(row.avg_politeness)?.toFixed(2) || 0,
      bookingRate: row.total_conversations > 0 ?
        ((parseInt(row.booking_conversions) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0,
      paymentRate: row.total_conversations > 0 ?
        ((parseInt(row.payment_conversions) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0
    }));
  }

  async getResponseTimeData(days, groupBy) {
    const timeFormat = groupBy === 'hour' ? 'YYYY-MM-DD HH24:00:00' :
                      groupBy === 'week' ? 'YYYY-"W"IW' :
                      'YYYY-MM-DD';

    const query = `
      SELECT
        TO_CHAR(c.started_at, '${timeFormat}') as time_period,
        AVG(cm.first_response_time_minutes) as avg_first_response,
        AVG(cm.avg_response_time_minutes) as avg_response_time,
        COUNT(*) as conversation_count
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      WHERE c.started_at >= NOW() - INTERVAL '${days} days'
        AND cm.first_response_time_minutes IS NOT NULL
      GROUP BY time_period
      ORDER BY time_period
    `;

    const result = await db.query(query);
    return result.rows.map(row => ({
      timePeriod: row.time_period,
      avgFirstResponse: parseFloat(row.avg_first_response)?.toFixed(1) || 0,
      avgResponseTime: parseFloat(row.avg_response_time)?.toFixed(1) || 0,
      conversationCount: parseInt(row.conversation_count) || 0
    }));
  }

  async getConversionData(days) {
    const query = `
      SELECT
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN cm.has_booking_conversion THEN 1 END) as booking_conversions,
        COUNT(CASE WHEN cm.has_payment_conversion THEN 1 END) as payment_conversions,
        COUNT(CASE WHEN cm.has_upsell_attempt THEN 1 END) as upsell_attempts,
        c.platform
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      WHERE c.started_at >= NOW() - INTERVAL '${days} days'
      GROUP BY c.platform
      ORDER BY c.platform
    `;

    const result = await db.query(query);
    return result.rows.map(row => ({
      platform: row.platform,
      totalConversations: parseInt(row.total_conversations) || 0,
      bookingConversions: parseInt(row.booking_conversions) || 0,
      paymentConversions: parseInt(row.payment_conversions) || 0,
      upsellAttempts: parseInt(row.upsell_attempts) || 0,
      bookingRate: row.total_conversations > 0 ?
        ((parseInt(row.booking_conversions) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0,
      paymentRate: row.total_conversations > 0 ?
        ((parseInt(row.payment_conversions) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0,
      upsellRate: row.total_conversations > 0 ?
        ((parseInt(row.upsell_attempts) / parseInt(row.total_conversations)) * 100).toFixed(1) : 0
    }));
  }
}

module.exports = new MetricsController();