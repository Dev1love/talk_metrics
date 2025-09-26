const BaseModel = require('./BaseModel');

class Participant extends BaseModel {
  constructor() {
    super('participants');
  }

  async findOrCreateParticipant(participantData) {
    const { name, phone, platform, platform_id, is_business = false } = participantData;

    // First try to find existing participant by platform_id or phone
    let participant = null;

    if (platform_id) {
      const existingByPlatformId = await this.findAll({
        platform_id,
        platform
      });
      if (existingByPlatformId.length > 0) {
        participant = existingByPlatformId[0];
      }
    }

    if (!participant && phone) {
      const existingByPhone = await this.findAll({
        phone,
        platform
      });
      if (existingByPhone.length > 0) {
        participant = existingByPhone[0];
      }
    }

    // If not found, create new participant
    if (!participant) {
      participant = await this.create({
        name,
        phone,
        platform,
        platform_id,
        is_business
      });
    }

    return participant;
  }

  async getBusinessParticipants(platform = null) {
    const conditions = { is_business: true };
    if (platform) {
      conditions.platform = platform;
    }
    return await this.findAll(conditions);
  }

  async getParticipantsByConversation(conversationId) {
    const query = `
      SELECT DISTINCT p.*
      FROM participants p
      INNER JOIN messages m ON p.id = m.participant_id
      WHERE m.conversation_id = $1
      ORDER BY p.name
    `;

    const db = require('../config/database');
    const result = await db.query(query, [conversationId]);
    return result.rows;
  }

  async updateParticipantStats() {
    const query = `
      UPDATE participants
      SET updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT participant_id
        FROM messages
        WHERE created_at > NOW() - INTERVAL '1 day'
      )
    `;

    const db = require('../config/database');
    await db.query(query);
  }
}

module.exports = new Participant();