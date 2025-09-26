const metricsCalculationService = require('./metricsCalculationService');
const cciCalculationService = require('./cciCalculationService');
const logger = require('../config/logger');

class SchedulerService {
  constructor() {
    this.intervals = new Map();
  }

  // Auto-calculate metrics for new conversations
  async scheduleMetricsCalculation(conversationId, delayMinutes = 5) {
    try {
      const delay = delayMinutes * 60 * 1000; // Convert to milliseconds

      const timeoutId = setTimeout(async () => {
        try {
          logger.info(`Auto-calculating metrics for conversation: ${conversationId}`);
          await metricsCalculationService.calculateAndSaveMetrics(conversationId);
          logger.info(`Auto-calculation completed for conversation: ${conversationId}`);
        } catch (error) {
          logger.error(`Auto-calculation failed for conversation ${conversationId}:`, error);
        }
      }, delay);

      // Store timeout ID for potential cancellation
      this.intervals.set(`metrics_${conversationId}`, timeoutId);

      logger.info(`Scheduled metrics calculation for conversation ${conversationId} in ${delayMinutes} minutes`);

    } catch (error) {
      logger.error(`Failed to schedule metrics calculation for conversation ${conversationId}:`, error);
    }
  }

  // Schedule daily CCI calculation
  startDailyCCICalculation(hour = 1) { // Default: 1 AM
    try {
      const calculateCCI = async () => {
        try {
          logger.info('Starting daily CCI calculation');

          const cciResult = await cciCalculationService.calculateCCI();
          await cciCalculationService.saveCCIToDatabase(cciResult);

          logger.info(`Daily CCI calculation completed: ${cciResult.cci_score}/100`);
        } catch (error) {
          logger.error('Daily CCI calculation failed:', error);
        }
      };

      // Calculate time until next scheduled hour
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, 0, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (now >= scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();

      // Initial calculation
      const initialTimeout = setTimeout(() => {
        calculateCCI();

        // Set up daily recurring calculation
        const dailyInterval = setInterval(calculateCCI, 24 * 60 * 60 * 1000); // 24 hours
        this.intervals.set('daily_cci', dailyInterval);
      }, delay);

      this.intervals.set('initial_cci', initialTimeout);

      logger.info(`Daily CCI calculation scheduled for ${scheduledTime.toISOString()} and every 24 hours after`);

    } catch (error) {
      logger.error('Failed to start daily CCI calculation:', error);
    }
  }

  // Schedule periodic metrics recalculation for all conversations
  startPeriodicMetricsRecalculation(intervalHours = 6) {
    try {
      const recalculateMetrics = async () => {
        try {
          logger.info('Starting periodic metrics recalculation');

          const summary = await metricsCalculationService.recalculateAllMetrics();

          logger.info('Periodic metrics recalculation completed:', summary);
        } catch (error) {
          logger.error('Periodic metrics recalculation failed:', error);
        }
      };

      // Run immediately on startup (after a short delay)
      const initialTimeout = setTimeout(() => {
        recalculateMetrics();

        // Set up recurring recalculation
        const interval = setInterval(recalculateMetrics, intervalHours * 60 * 60 * 1000);
        this.intervals.set('periodic_recalc', interval);
      }, 30000); // 30 seconds initial delay

      this.intervals.set('initial_recalc', initialTimeout);

      logger.info(`Periodic metrics recalculation scheduled every ${intervalHours} hours`);

    } catch (error) {
      logger.error('Failed to start periodic metrics recalculation:', error);
    }
  }

  // Cancel scheduled task
  cancelScheduledTask(taskId) {
    try {
      const intervalId = this.intervals.get(taskId);
      if (intervalId) {
        clearTimeout(intervalId);
        clearInterval(intervalId);
        this.intervals.delete(taskId);
        logger.info(`Cancelled scheduled task: ${taskId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to cancel scheduled task ${taskId}:`, error);
      return false;
    }
  }

  // Start all scheduled tasks
  startAllTasks() {
    try {
      logger.info('Starting all scheduled tasks');

      // Start daily CCI calculation at 1 AM
      this.startDailyCCICalculation(1);

      // Start periodic metrics recalculation every 6 hours
      this.startPeriodicMetricsRecalculation(6);

      // Start periodic insights generation every 12 hours
      this.startPeriodicInsightsGeneration(12);

      logger.info('All scheduled tasks started successfully');
    } catch (error) {
      logger.error('Failed to start scheduled tasks:', error);
    }
  }

  // Stop all scheduled tasks
  stopAllTasks() {
    try {
      logger.info('Stopping all scheduled tasks');

      for (const [taskId, intervalId] of this.intervals) {
        clearTimeout(intervalId);
        clearInterval(intervalId);
        logger.info(`Stopped task: ${taskId}`);
      }

      this.intervals.clear();
      logger.info('All scheduled tasks stopped');
    } catch (error) {
      logger.error('Failed to stop scheduled tasks:', error);
    }
  }

  // Get status of all scheduled tasks
  getTaskStatus() {
    return {
      activeTasks: Array.from(this.intervals.keys()),
      totalTasks: this.intervals.size,
      tasks: {
        dailyCCI: this.intervals.has('daily_cci') || this.intervals.has('initial_cci'),
        periodicRecalculation: this.intervals.has('periodic_recalc') || this.intervals.has('initial_recalc'),
        periodicInsights: this.intervals.has('periodic_insights') || this.intervals.has('initial_insights'),
        conversationMetrics: Array.from(this.intervals.keys()).filter(key => key.startsWith('metrics_')).length,
        conversationAI: Array.from(this.intervals.keys()).filter(key => key.startsWith('ai_')).length
      }
    };
  }

  // Schedule task when new conversation is created
  onConversationCreated(conversationId) {
    // Schedule metrics calculation 5 minutes after conversation creation
    this.scheduleMetricsCalculation(conversationId, 5);

    // Schedule AI analysis 2 minutes after conversation creation
    this.scheduleAIAnalysis(conversationId, 2);
  }

  // Schedule AI analysis for new conversations
  async scheduleAIAnalysis(conversationId, delayMinutes = 2) {
    try {
      const delay = delayMinutes * 60 * 1000;

      const timeoutId = setTimeout(async () => {
        try {
          logger.info(`Auto-starting AI analysis for conversation: ${conversationId}`);
          const aiAnalysisService = require('./aiAnalysisService');
          await aiAnalysisService.analyzeConversation(conversationId);
          logger.info(`AI analysis completed for conversation: ${conversationId}`);
        } catch (error) {
          logger.error(`AI analysis failed for conversation ${conversationId}:`, error);
        }
      }, delay);

      this.intervals.set(`ai_${conversationId}`, timeoutId);

      logger.info(`Scheduled AI analysis for conversation ${conversationId} in ${delayMinutes} minutes`);

    } catch (error) {
      logger.error(`Failed to schedule AI analysis for conversation ${conversationId}:`, error);
    }
  }

  // Schedule periodic insights generation
  startPeriodicInsightsGeneration(intervalHours = 12) {
    try {
      const generateInsights = async () => {
        try {
          logger.info('Starting periodic insights generation');

          const insightsService = require('./insightsGenerationService');
          const insights = await insightsService.generateInsights();

          logger.info(`Periodic insights generation completed: ${insights.length} insights generated`);
        } catch (error) {
          logger.error('Periodic insights generation failed:', error);
        }
      };

      // Run immediately on startup (after a delay)
      const initialTimeout = setTimeout(() => {
        generateInsights();

        // Set up recurring generation
        const interval = setInterval(generateInsights, intervalHours * 60 * 60 * 1000);
        this.intervals.set('periodic_insights', interval);
      }, 60000); // 1 minute initial delay

      this.intervals.set('initial_insights', initialTimeout);

      logger.info(`Periodic insights generation scheduled every ${intervalHours} hours`);

    } catch (error) {
      logger.error('Failed to start periodic insights generation:', error);
    }
  }

  // Clean up when conversation is deleted
  onConversationDeleted(conversationId) {
    this.cancelScheduledTask(`metrics_${conversationId}`);
    this.cancelScheduledTask(`ai_${conversationId}`);
  }
}

module.exports = new SchedulerService();