const whatsappParser = require('./parsers/whatsappParser');
const telegramParser = require('./parsers/telegramParser');
const Participant = require('../models/Participant');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../config/logger');
const db = require('../config/database');

class ChatParserService {
  async parseFile(file, platform, uploadId) {
    try {
      logger.info(`Starting to parse ${platform} file: ${file.originalname}`);

      // Select appropriate parser
      let parser;
      switch (platform) {
        case 'whatsapp':
          parser = whatsappParser;
          break;
        case 'telegram':
          parser = telegramParser;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Parse the file
      const parseResult = await parser.parseFile(file.path);

      if (!parseResult.messages || parseResult.messages.length === 0) {
        throw new Error('No messages found in the file');
      }

      // Normalize and save to database
      const stats = await this.saveToDatabase(parseResult, uploadId);

      logger.info(`Successfully processed ${file.originalname}:`, stats);
      return stats;

    } catch (error) {
      logger.error(`Failed to parse file ${file.originalname}:`, error);
      throw error;
    }
  }

  async saveToDatabase(parseResult, uploadId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const { conversation: conversationData, participants: participantsData, messages: messagesData } = parseResult;

      // Create participants
      const participantMap = new Map();
      for (const participantData of participantsData) {
        const participant = await Participant.findOrCreateParticipant(participantData);
        participantMap.set(participantData.name, participant);
      }

      // Create conversation
      const conversation = await Conversation.createConversation({
        title: conversationData.title,
        platform: conversationData.platform,
        platform_conversation_id: conversationData.platform_conversation_id,
        status: conversationData.status || 'closed',
        started_at: conversationData.started_at,
        closed_at: conversationData.closed_at
      });

      // Create messages
      const createdMessages = [];
      for (const messageData of messagesData) {
        const participant = participantMap.get(messageData.participant_name);
        if (!participant) {
          logger.warn(`Participant not found for message: ${messageData.participant_name}`);
          continue;
        }

        const message = await Message.createMessage({
          conversation_id: conversation.id,
          participant_id: participant.id,
          content: messageData.content,
          message_type: messageData.message_type || 'text',
          direction: messageData.direction,
          timestamp_original: messageData.timestamp_original,
          timestamp_normalized: messageData.timestamp_normalized,
          platform_message_id: messageData.platform_message_id,
          is_forwarded: messageData.is_forwarded || false,
          reply_to_message_id: messageData.reply_to_message_id
        });

        createdMessages.push(message);
      }

      // Update conversation stats
      await Conversation.updateConversationStats(conversation.id);

      await client.query('COMMIT');

      const stats = {
        conversations_created: 1,
        participants_created: participantsData.length,
        messages_created: createdMessages.length,
        conversation_id: conversation.id
      };

      // Schedule metrics calculation for the new conversation
      const schedulerService = require('./schedulerService');
      schedulerService.onConversationCreated(conversation.id);

      logger.info(`Database save completed for upload ${uploadId}:`, stats);
      return stats;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to save to database for upload ${uploadId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async validateParsedData(parseResult) {
    const { conversation, participants, messages } = parseResult;

    // Validate conversation
    if (!conversation || !conversation.title || !conversation.platform) {
      throw new Error('Invalid conversation data');
    }

    // Validate participants
    if (!participants || participants.length === 0) {
      throw new Error('No participants found');
    }

    for (const participant of participants) {
      if (!participant.name || !participant.platform) {
        throw new Error(`Invalid participant data: ${JSON.stringify(participant)}`);
      }
    }

    // Validate messages
    if (!messages || messages.length === 0) {
      throw new Error('No messages found');
    }

    for (const message of messages) {
      if (!message.content || !message.direction || !message.timestamp_normalized || !message.participant_name) {
        throw new Error(`Invalid message data: ${JSON.stringify(message)}`);
      }

      if (!['incoming', 'outgoing'].includes(message.direction)) {
        throw new Error(`Invalid message direction: ${message.direction}`);
      }
    }

    return true;
  }

  async normalizeParsedData(parseResult) {
    const { conversation, participants, messages } = parseResult;

    // Normalize conversation
    const normalizedConversation = {
      ...conversation,
      title: this.cleanText(conversation.title),
      started_at: new Date(conversation.started_at).toISOString(),
      closed_at: conversation.closed_at ? new Date(conversation.closed_at).toISOString() : null
    };

    // Normalize participants
    const normalizedParticipants = participants.map(participant => ({
      ...participant,
      name: this.cleanText(participant.name),
      phone: this.normalizePhone(participant.phone)
    }));

    // Normalize messages
    const normalizedMessages = messages.map(message => ({
      ...message,
      content: this.cleanText(message.content),
      timestamp_original: new Date(message.timestamp_original).toISOString(),
      timestamp_normalized: new Date(message.timestamp_normalized).toISOString(),
      participant_name: this.cleanText(message.participant_name)
    }));

    // Sort messages by timestamp
    normalizedMessages.sort((a, b) =>
      new Date(a.timestamp_normalized) - new Date(b.timestamp_normalized)
    );

    return {
      conversation: normalizedConversation,
      participants: normalizedParticipants,
      messages: normalizedMessages
    };
  }

  cleanText(text) {
    if (!text) return '';

    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/[^\x20-\x7E\u0400-\u04FF\u0500-\u052F]/g, '') // Keep only printable Latin and Cyrillic
      .substring(0, 1000); // Limit length
  }

  normalizePhone(phone) {
    if (!phone) return null;

    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }

    return cleaned || null;
  }

  async getParsingStats() {
    try {
      const stats = await db.query(`
        SELECT
          platform,
          COUNT(*) as total_uploads,
          SUM(conversations_created) as total_conversations,
          SUM(messages_created) as total_messages,
          SUM(participants_created) as total_participants,
          COUNT(CASE WHEN upload_status = 'completed' THEN 1 END) as successful_uploads,
          COUNT(CASE WHEN upload_status = 'failed' THEN 1 END) as failed_uploads
        FROM file_uploads
        GROUP BY platform
        UNION ALL
        SELECT
          'total' as platform,
          COUNT(*) as total_uploads,
          SUM(conversations_created) as total_conversations,
          SUM(messages_created) as total_messages,
          SUM(participants_created) as total_participants,
          COUNT(CASE WHEN upload_status = 'completed' THEN 1 END) as successful_uploads,
          COUNT(CASE WHEN upload_status = 'failed' THEN 1 END) as failed_uploads
        FROM file_uploads
      `);

      return stats.rows;
    } catch (error) {
      logger.error('Failed to get parsing stats:', error);
      throw error;
    }
  }
}

module.exports = new ChatParserService();