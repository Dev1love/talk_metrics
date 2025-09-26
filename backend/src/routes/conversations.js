const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../config/logger');

// Get all conversations with metrics
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, platform, status, search } = req.query;

    let conversations;

    if (search) {
      conversations = await Conversation.searchConversations(search, parseInt(limit));
    } else if (platform) {
      conversations = await Conversation.getConversationsByPlatform(platform);
    } else {
      conversations = await Conversation.getConversationsWithMetrics(
        parseInt(limit),
        parseInt(offset)
      );
    }

    // Filter by status if provided
    if (status) {
      conversations = conversations.filter(conv => conv.status === status);
    }

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: conversations.length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get conversations:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve conversations' }
    });
  }
});

// Get specific conversation with messages
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.getConversationWithMessages(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }

    res.json({
      success: true,
      data: { conversation }
    });

  } catch (error) {
    logger.error('Failed to get conversation details:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve conversation details' }
    });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, direction } = req.query;

    let messages;

    if (direction) {
      messages = await Message.getMessagesByDirection(conversationId, direction);
    } else {
      messages = await Message.getMessagesByConversation(
        conversationId,
        limit ? parseInt(limit) : null
      );
    }

    res.json({
      success: true,
      data: {
        messages,
        count: messages.length
      }
    });

  } catch (error) {
    logger.error('Failed to get conversation messages:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve messages' }
    });
  }
});

// Update conversation status
router.patch('/:conversationId/status', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['open', 'closed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status. Allowed: open, closed, resolved' }
      });
    }

    let updatedConversation;

    if (status === 'closed' || status === 'resolved') {
      updatedConversation = await Conversation.closeConversation(conversationId);
    } else {
      updatedConversation = await Conversation.update(conversationId, {
        status,
        closed_at: null
      });
    }

    if (!updatedConversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }

    res.json({
      success: true,
      data: { conversation: updatedConversation }
    });

  } catch (error) {
    logger.error('Failed to update conversation status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update conversation status' }
    });
  }
});

// Get conversations by date range
router.get('/date-range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid date format. Use YYYY-MM-DD' }
      });
    }

    const conversations = await Conversation.getConversationsByDateRange(start, end);

    res.json({
      success: true,
      data: {
        conversations,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        count: conversations.length
      }
    });

  } catch (error) {
    logger.error('Failed to get conversations by date range:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve conversations by date range' }
    });
  }
});

// Get response time stats for conversation
router.get('/:conversationId/response-times', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const stats = await Message.getResponseTimeStats(conversationId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: { message: 'No response time data found for this conversation' }
      });
    }

    res.json({
      success: true,
      data: {
        conversationId,
        responseTimeStats: {
          minResponseTimeMinutes: parseFloat(stats.min_response_time) || 0,
          maxResponseTimeMinutes: parseFloat(stats.max_response_time) || 0,
          avgResponseTimeMinutes: parseFloat(stats.avg_response_time) || 0,
          responseCount: parseInt(stats.response_count) || 0
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get response time stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve response time statistics' }
    });
  }
});

// Delete conversation and all related data
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }

    await Conversation.delete(conversationId);

    res.json({
      success: true,
      data: {
        message: 'Conversation deleted successfully',
        deletedConversation: conversation
      }
    });

  } catch (error) {
    logger.error('Failed to delete conversation:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete conversation' }
    });
  }
});

module.exports = router;