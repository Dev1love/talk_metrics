const BaseModel = require('./BaseModel');
const db = require('../config/database');

class Conversation extends BaseModel {
  constructor() {
    super('conversations');
  }

  async createConversation(conversationData) {
    const {
      title,
      platform,
      platform_conversation_id,
      status = 'open',
      started_at,
      closed_at = null
    } = conversationData;

    return await this.create({
      title,
      platform,
      platform_conversation_id,
      status,
      started_at,
      closed_at
    });
  }

  async getConversationWithMessages(conversationId) {
    const query = `
      SELECT
        c.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'content', m.content,
            'message_type', m.message_type,
            'direction', m.direction,
            'timestamp_normalized', m.timestamp_normalized,
            'participant', json_build_object(
              'id', p.id,
              'name', p.name,
              'is_business', p.is_business
            )
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

  async getConversationsWithMetrics(limit = 50, offset = 0) {
    const query = `
      SELECT
        c.*,
        cm.first_response_time_minutes,
        cm.avg_response_time_minutes,
        cm.total_response_time_minutes,
        cm.is_completed,
        cm.has_booking_conversion,
        cm.has_payment_conversion,
        cm.has_upsell_attempt,
        cm.avg_politeness_score,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
        ) as actual_message_count
      FROM conversations c
      LEFT JOIN conversation_metrics cm ON c.id = cm.conversation_id
      ORDER BY c.started_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  async updateConversationStats(conversationId) {
    const statsQuery = `
      UPDATE conversations
      SET
        message_count = (
          SELECT COUNT(*)
          FROM messages
          WHERE conversation_id = $1
        ),
        participant_count = (
          SELECT COUNT(DISTINCT participant_id)
          FROM messages
          WHERE conversation_id = $1
        ),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(statsQuery, [conversationId]);
    return result.rows[0];
  }

  async closeConversation(conversationId, closedAt = new Date()) {
    return await this.update(conversationId, {
      status: 'closed',
      closed_at: closedAt
    });
  }

  async getActiveConversations() {
    return await this.findAll(
      { status: 'open' },
      'started_at DESC'
    );
  }

  async getConversationsByPlatform(platform) {
    return await this.findAll(
      { platform },
      'started_at DESC'
    );
  }

  async getConversationsByDateRange(startDate, endDate) {
    const query = `
      SELECT *
      FROM conversations
      WHERE started_at >= $1 AND started_at <= $2
      ORDER BY started_at DESC
    `;

    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  async searchConversations(searchTerm, limit = 20) {
    const query = `
      SELECT DISTINCT c.*
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE
        c.title ILIKE $1
        OR m.content ILIKE $1
      ORDER BY c.started_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }
}

module.exports = new Conversation();