const BaseModel = require('./BaseModel');
const db = require('../config/database');

class Message extends BaseModel {
  constructor() {
    super('messages');
  }

  async createMessage(messageData) {
    const {
      conversation_id,
      participant_id,
      content,
      message_type = 'text',
      direction,
      timestamp_original,
      timestamp_normalized,
      platform_message_id = null,
      is_forwarded = false,
      reply_to_message_id = null
    } = messageData;

    return await this.create({
      conversation_id,
      participant_id,
      content,
      message_type,
      direction,
      timestamp_original,
      timestamp_normalized,
      platform_message_id,
      is_forwarded,
      reply_to_message_id
    });
  }

  async getMessagesByConversation(conversationId, limit = null) {
    const query = `
      SELECT
        m.*,
        p.name as participant_name,
        p.is_business as participant_is_business
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      WHERE m.conversation_id = $1
      ORDER BY m.timestamp_normalized ASC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = [conversationId];
    if (limit) {
      params.push(limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async getMessageWithAnalysis(messageId) {
    const query = `
      SELECT
        m.*,
        p.name as participant_name,
        p.is_business as participant_is_business,
        ai.intention,
        ai.intention_confidence,
        ai.politeness_score,
        ai.sentiment,
        ai.sentiment_confidence,
        ai.contains_keywords
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      LEFT JOIN ai_analysis ai ON m.id = ai.message_id
      WHERE m.id = $1
    `;

    const result = await db.query(query, [messageId]);
    return result.rows[0];
  }

  async getMessagesByDirection(conversationId, direction) {
    return await this.findAll({
      conversation_id: conversationId,
      direction
    }, 'timestamp_normalized ASC');
  }

  async getMessagesByDateRange(startDate, endDate, limit = 100) {
    const query = `
      SELECT
        m.*,
        p.name as participant_name,
        p.is_business as participant_is_business,
        c.title as conversation_title
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.timestamp_normalized >= $1
        AND m.timestamp_normalized <= $2
      ORDER BY m.timestamp_normalized DESC
      LIMIT $3
    `;

    const result = await db.query(query, [startDate, endDate, limit]);
    return result.rows;
  }

  async searchMessages(searchTerm, conversationId = null, limit = 50) {
    let query = `
      SELECT
        m.*,
        p.name as participant_name,
        p.is_business as participant_is_business,
        c.title as conversation_title
      FROM messages m
      INNER JOIN participants p ON m.participant_id = p.id
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.content ILIKE $1
    `;

    const params = [`%${searchTerm}%`];

    if (conversationId) {
      query += ` AND m.conversation_id = $${params.length + 1}`;
      params.push(conversationId);
    }

    query += ` ORDER BY m.timestamp_normalized DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  async getResponseTimeStats(conversationId) {
    const query = `
      WITH message_pairs AS (
        SELECT
          m1.id as incoming_id,
          m1.timestamp_normalized as incoming_time,
          m2.timestamp_normalized as outgoing_time,
          EXTRACT(EPOCH FROM (m2.timestamp_normalized - m1.timestamp_normalized))/60 as response_time_minutes
        FROM messages m1
        INNER JOIN messages m2 ON m1.conversation_id = m2.conversation_id
        WHERE m1.conversation_id = $1
          AND m1.direction = 'incoming'
          AND m2.direction = 'outgoing'
          AND m2.timestamp_normalized > m1.timestamp_normalized
          AND NOT EXISTS (
            SELECT 1 FROM messages m3
            WHERE m3.conversation_id = m1.conversation_id
              AND m3.direction = 'outgoing'
              AND m3.timestamp_normalized > m1.timestamp_normalized
              AND m3.timestamp_normalized < m2.timestamp_normalized
          )
      )
      SELECT
        MIN(response_time_minutes) as min_response_time,
        MAX(response_time_minutes) as max_response_time,
        AVG(response_time_minutes) as avg_response_time,
        COUNT(*) as response_count
      FROM message_pairs
      WHERE response_time_minutes > 0
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  async bulkCreateMessages(messages) {
    if (messages.length === 0) return [];

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const createdMessages = [];
      for (const messageData of messages) {
        const message = await this.createMessage(messageData);
        createdMessages.push(message);
      }

      await client.query('COMMIT');
      return createdMessages;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new Message();