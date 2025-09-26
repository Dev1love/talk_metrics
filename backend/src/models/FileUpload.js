const BaseModel = require('./BaseModel');
const db = require('../config/database');

class FileUpload extends BaseModel {
  constructor() {
    super('file_uploads');
  }

  async createUpload(fileData) {
    const upload = await this.create({
      filename: fileData.filename,
      file_size: fileData.size,
      file_type: fileData.type,
      platform: fileData.platform,
      upload_status: 'pending'
    });

    return upload;
  }

  async updateProcessingStatus(id, status, error = null, stats = {}) {
    const updateData = {
      upload_status: status,
      processed_at: new Date()
    };

    if (error) {
      updateData.processing_error = error;
    }

    if (stats.conversations_created) {
      updateData.conversations_created = stats.conversations_created;
    }

    if (stats.messages_created) {
      updateData.messages_created = stats.messages_created;
    }

    if (stats.participants_created) {
      updateData.participants_created = stats.participants_created;
    }

    return await this.update(id, updateData);
  }

  async getUploadsByStatus(status) {
    return await this.findAll({ upload_status: status });
  }

  async getUploadStats(uploadId) {
    const query = `
      SELECT
        fu.*,
        COALESCE(c.conversation_count, 0) as actual_conversations,
        COALESCE(m.message_count, 0) as actual_messages,
        COALESCE(p.participant_count, 0) as actual_participants
      FROM file_uploads fu
      LEFT JOIN (
        SELECT COUNT(*) as conversation_count
        FROM conversations
        WHERE created_at >= (SELECT uploaded_at FROM file_uploads WHERE id = $1)
      ) c ON true
      LEFT JOIN (
        SELECT COUNT(*) as message_count
        FROM messages
        WHERE created_at >= (SELECT uploaded_at FROM file_uploads WHERE id = $1)
      ) m ON true
      LEFT JOIN (
        SELECT COUNT(*) as participant_count
        FROM participants
        WHERE created_at >= (SELECT uploaded_at FROM file_uploads WHERE id = $1)
      ) p ON true
      WHERE fu.id = $1
    `;

    const result = await db.query(query, [uploadId]);
    return result.rows[0];
  }
}

module.exports = new FileUpload();