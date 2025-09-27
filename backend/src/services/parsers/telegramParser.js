const moment = require('moment');
const logger = require('../../config/logger');

class TelegramParser {
  constructor() {
    // Business account indicators
    this.businessIndicators = [
      'support', 'помощь', 'администрация', 'admin', 'bot', 'бот',
      'менеджер', 'manager', 'service', 'сервис', 'info', 'инфо'
    ];
  }

  async parseFile(filePath) {
    try {
      const fs = require('fs').promises;
      const content = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(content);

      return this.parseContent(jsonData);
    } catch (error) {
      logger.error('Failed to read/parse Telegram JSON file:', error);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  parseContent(jsonData) {
    try {
      // Validate JSON structure
      if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
        throw new Error('Invalid Telegram export format: missing messages array');
      }

      const messages = [];
      const participants = new Map();
      let businessParticipant = null;

      logger.info(`Parsing Telegram chat with ${jsonData.messages.length} messages`);

      // Process chat information
      const chatInfo = {
        title: jsonData.name || jsonData.title || 'Telegram чат',
        type: jsonData.type || 'private_chat',
        id: jsonData.id || null
      };

      // Process messages
      for (const msgData of jsonData.messages) {
        try {
          const message = this.parseMessage(msgData, chatInfo);
          if (!message) continue;

          messages.push(message);

          // Process participant
          if (message.participant_name) {
            const participantKey = message.participant_name;

            if (!participants.has(participantKey)) {
              const isBusiness = this.isBusinessAccount(message.participant_name, message.participant_username);

              participants.set(participantKey, {
                name: message.participant_name,
                phone: message.participant_phone,
                platform: 'telegram',
                platform_id: message.participant_username || message.participant_id,
                is_business: isBusiness
              });

              if (isBusiness && !businessParticipant) {
                businessParticipant = participantKey;
              }
            }
          }
        } catch (error) {
          logger.warn(`Failed to parse message:`, error.message);
          continue;
        }
      }

      // Determine conversation details
      const conversation = {
        title: this.generateConversationTitle(chatInfo, messages),
        platform: 'telegram',
        platform_conversation_id: chatInfo.id?.toString(),
        started_at: messages.length > 0 ? messages[0].timestamp_normalized : new Date().toISOString(),
        status: 'closed' // Exported chats are typically closed
      };

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        conversation.closed_at = lastMessage.timestamp_normalized;
      }

      const result = {
        conversation,
        participants: Array.from(participants.values()),
        messages,
        stats: {
          total_messages: jsonData.messages.length,
          parsed_messages: messages.length,
          participants_count: participants.size,
          business_participant: businessParticipant,
          chat_type: chatInfo.type
        }
      };

      logger.info('Telegram parsing completed:', result.stats);
      return result;

    } catch (error) {
      logger.error('Failed to parse Telegram content:', error);
      throw error;
    }
  }

  parseMessage(msgData, chatInfo) {
    // Skip service messages
    if (msgData.type && msgData.type !== 'message') {
      return null;
    }

    // Extract timestamp
    const timestamp = this.parseTimestamp(msgData.date);
    if (!timestamp) {
      return null;
    }

    // Extract sender information
    const senderInfo = this.extractSenderInfo(msgData, chatInfo);
    if (!senderInfo.name) {
      return null;
    }

    // Extract message content
    const content = this.extractMessageContent(msgData);
    if (!content.trim()) {
      return null;
    }

    // Determine message direction
    const isBusiness = this.isBusinessAccount(senderInfo.name, senderInfo.username);
    const direction = isBusiness ? 'outgoing' : 'incoming';

    return {
      content: content,
      message_type: this.detectMessageType(msgData),
      direction,
      timestamp_original: timestamp,
      timestamp_normalized: timestamp,
      participant_name: senderInfo.name,
      participant_username: senderInfo.username,
      participant_id: senderInfo.id,
      participant_phone: senderInfo.phone,
      platform_message_id: msgData.id?.toString(),
      is_forwarded: Boolean(msgData.forwarded_from),
      reply_to_message_id: msgData.reply_to_message_id?.toString()
    };
  }

  parseTimestamp(dateStr) {
    try {
      // Telegram exports use ISO format: "2024-09-25T09:00:00"
      const momentDate = moment(dateStr);

      if (!momentDate.isValid()) {
        // Try parsing as Unix timestamp
        const unixDate = moment.unix(parseInt(dateStr));
        if (unixDate.isValid()) {
          return unixDate.toISOString();
        }
        return null;
      }

      return momentDate.toISOString();
    } catch (error) {
      logger.error(`Error parsing timestamp ${dateStr}:`, error);
      return null;
    }
  }

  extractSenderInfo(msgData, chatInfo) {
    const senderInfo = {
      name: null,
      username: null,
      id: null,
      phone: null
    };

    // Check different possible sender fields
    if (msgData.from) {
      senderInfo.name = this.formatName(msgData.from);
      senderInfo.id = msgData.from_id || msgData.actor_id;
    } else if (msgData.actor) {
      senderInfo.name = msgData.actor;
      senderInfo.id = msgData.actor_id;
    } else if (msgData.from_id) {
      senderInfo.id = msgData.from_id;
      senderInfo.name = `User ${msgData.from_id}`;
    }

    // Extract username if available
    if (msgData.from && msgData.from.includes('@')) {
      const parts = msgData.from.split(' ');
      const usernamePart = parts.find(part => part.startsWith('@'));
      if (usernamePart) {
        senderInfo.username = usernamePart.slice(1); // Remove @
      }
    }

    // Extract phone if available
    if (msgData.contact && msgData.contact.phone_number) {
      senderInfo.phone = msgData.contact.phone_number;
    }

    return senderInfo;
  }

  extractMessageContent(msgData) {
    let content = '';

    // Handle different content types
    if (typeof msgData.text === 'string') {
      content = msgData.text;
    } else if (Array.isArray(msgData.text)) {
      // Handle formatted text
      content = msgData.text.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.text) return item.text;
        return '';
      }).join('');
    } else if (msgData.text_entities) {
      // Handle text entities format
      content = msgData.text_entities.map(entity => entity.text || '').join('');
    }

    // Handle media messages
    if (!content.trim()) {
      if (msgData.photo) {
        content = '[Фото]';
      } else if (msgData.file) {
        content = `[Файл: ${msgData.file}]`;
      } else if (msgData.media_type) {
        content = `[Медиа: ${msgData.media_type}]`;
      } else if (msgData.sticker_emoji) {
        content = `[Стикер: ${msgData.sticker_emoji}]`;
      } else if (msgData.location) {
        content = '[Геолокация]';
      } else if (msgData.contact) {
        content = `[Контакт: ${msgData.contact.first_name || ''} ${msgData.contact.last_name || ''}]`;
      }
    }

    return content.trim();
  }

  detectMessageType(msgData) {
    if (msgData.photo) return 'image';
    if (msgData.voice_message) return 'audio';
    if (msgData.video_message || msgData.video_file) return 'video';
    if (msgData.file) return 'document';
    if (msgData.location) return 'location';
    if (msgData.contact) return 'contact';
    if (msgData.sticker_emoji) return 'sticker';
    return 'text';
  }

  formatName(fromField) {
    if (typeof fromField === 'string') {
      return fromField.trim();
    }

    if (typeof fromField === 'object') {
      const parts = [];
      if (fromField.first_name) parts.push(fromField.first_name);
      if (fromField.last_name) parts.push(fromField.last_name);
      return parts.join(' ').trim() || fromField.username || `User ${fromField.id}`;
    }

    return 'Unknown User';
  }

  isBusinessAccount(name, username) {
    if (!name && !username) return false;

    const checkString = `${name || ''} ${username || ''}`.toLowerCase();
    return this.businessIndicators.some(indicator =>
      checkString.includes(indicator)
    );
  }

  generateConversationTitle(chatInfo, messages) {
    // Use chat title if available
    if (chatInfo.title && chatInfo.title !== 'Telegram чат') {
      return chatInfo.title;
    }

    if (messages.length === 0) return 'Telegram чат';

    // Look for keywords to generate meaningful title
    const firstFewMessages = messages.slice(0, 3);
    const content = firstFewMessages.map(m => m.content).join(' ').toLowerCase();

    if (content.includes('бронирование') || content.includes('бронь')) {
      return 'Бронирование';
    }
    if (content.includes('жалоба') || content.includes('проблема')) {
      return 'Жалоба/проблема';
    }
    if (content.includes('скидка') || content.includes('акция')) {
      return 'Вопрос о скидках';
    }
    if (content.includes('оплата') || content.includes('платеж')) {
      return 'Оплата';
    }

    // Extract participant name for title
    const customerName = messages.find(m => m.direction === 'incoming')?.participant_name;
    if (customerName && customerName !== 'Unknown User') {
      return `Чат с ${customerName}`;
    }

    return chatInfo.type === 'private_chat' ? 'Личный чат' : 'Telegram чат';
  }
}

module.exports = new TelegramParser();