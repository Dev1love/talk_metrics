const moment = require('moment');
const logger = require('../../config/logger');

class WhatsAppParser {
  constructor() {
    // Regular expression to match WhatsApp message format
    // Format: [DD/MM/YY, HH:MM:SS] Contact Name: Message content
    // Alternative format: DD/MM/YYYY, HH:MM - Contact Name: Message content
    this.messageRegex = /^(?:\[)?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*-?\s*([^:]+?):\s*(.+)$/;

    // System messages regex (joined, left, changed settings, etc.)
    this.systemMessageRegex = /^(?:\[)?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*-?\s*(.+)$/;

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

      return this.parseContent(content);
    } catch (error) {
      logger.error('Failed to read WhatsApp file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  parseContent(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const messages = [];
    const participants = new Map();
    let currentConversation = null;
    let businessParticipant = null;

    logger.info(`Parsing WhatsApp chat with ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try to parse as message
      const messageMatch = this.messageRegex.exec(line);

      if (messageMatch) {
        const [, dateStr, timeStr, contactName, messageContent] = messageMatch;

        // Parse timestamp
        const timestamp = this.parseTimestamp(dateStr, timeStr);
        if (!timestamp) {
          logger.warn(`Invalid timestamp in line ${i + 1}: ${dateStr} ${timeStr}`);
          continue;
        }

        // Normalize contact name
        const normalizedName = this.normalizeContactName(contactName);

        // Determine if this is a business account
        const isBusiness = this.isBusinessAccount(normalizedName);

        // Create/update participant
        if (!participants.has(normalizedName)) {
          participants.set(normalizedName, {
            name: normalizedName,
            phone: this.extractPhone(contactName),
            platform_id: normalizedName.toLowerCase().replace(/\s+/g, '_'),
            is_business: isBusiness
          });

          if (isBusiness && !businessParticipant) {
            businessParticipant = normalizedName;
          }
        }

        // Determine message direction
        const direction = isBusiness ? 'outgoing' : 'incoming';

        // Create message object
        const message = {
          content: this.cleanMessageContent(messageContent),
          message_type: this.detectMessageType(messageContent),
          direction,
          timestamp_original: timestamp,
          timestamp_normalized: timestamp,
          participant_name: normalizedName,
          is_forwarded: this.isForwardedMessage(messageContent)
        };

        messages.push(message);

        // Set conversation start time
        if (!currentConversation) {
          currentConversation = {
            started_at: timestamp,
            title: this.generateConversationTitle(messages),
            platform: 'whatsapp'
          };
        }
      } else {
        // Check if it's a system message
        const systemMatch = this.systemMessageRegex.exec(line);
        if (systemMatch && this.isSystemMessage(systemMatch[3])) {
          logger.debug(`Skipping system message: ${line}`);
          continue;
        }

        // Check if it's a continuation of previous message
        if (messages.length > 0 && !this.messageRegex.test(line)) {
          // Append to previous message content
          const lastMessage = messages[messages.length - 1];
          lastMessage.content += '\n' + line;
          continue;
        }

        logger.warn(`Could not parse line ${i + 1}: ${line}`);
      }
    }

    // Determine conversation end time
    if (currentConversation && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      currentConversation.closed_at = lastMessage.timestamp_normalized;

      // Determine conversation status
      const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp_normalized).getTime();
      const hoursGap = timeSinceLastMessage / (1000 * 60 * 60);

      currentConversation.status = hoursGap > 24 ? 'closed' : 'open';
    }

    const result = {
      conversation: currentConversation,
      participants: Array.from(participants.values()),
      messages,
      stats: {
        total_lines: lines.length,
        parsed_messages: messages.length,
        participants_count: participants.size,
        business_participant: businessParticipant
      }
    };

    logger.info('WhatsApp parsing completed:', result.stats);
    return result;
  }

  parseTimestamp(dateStr, timeStr) {
    try {
      // Handle different date formats
      let momentDate;

      if (dateStr.includes('/')) {
        // Try different date formats
        const formats = [
          'DD/MM/YYYY HH:mm:ss',
          'DD/MM/YYYY HH:mm',
          'DD/MM/YY HH:mm:ss',
          'DD/MM/YY HH:mm',
          'MM/DD/YYYY HH:mm:ss',
          'MM/DD/YYYY HH:mm',
          'MM/DD/YY HH:mm:ss',
          'MM/DD/YY HH:mm'
        ];

        const dateTimeStr = `${dateStr} ${timeStr}`;

        for (const format of formats) {
          momentDate = moment(dateTimeStr, format);
          if (momentDate.isValid()) break;
        }
      }

      if (!momentDate || !momentDate.isValid()) {
        return null;
      }

      return momentDate.toISOString();
    } catch (error) {
      logger.error(`Error parsing timestamp ${dateStr} ${timeStr}:`, error);
      return null;
    }
  }

  normalizeContactName(name) {
    return name.trim()
      .replace(/^\+\d+\s*/, '') // Remove phone numbers from start
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  extractPhone(contactName) {
    const phoneMatch = contactName.match(/^\+(\d+)/);
    return phoneMatch ? `+${phoneMatch[1]}` : null;
  }

  isBusinessAccount(name) {
    const lowerName = name.toLowerCase();
    return this.businessIndicators.some(indicator =>
      lowerName.includes(indicator)
    );
  }

  cleanMessageContent(content) {
    return content
      .replace(/<Media omitted>/g, '[Медиа файл]')
      .replace(/<attached: .+>/g, '[Вложение]')
      .replace(/\u200E/g, '') // Remove left-to-right mark
      .trim();
  }

  detectMessageType(content) {
    if (content.includes('[Медиа файл]') || content.includes('<Media omitted>')) {
      return 'image';
    }
    if (content.includes('[Вложение]') || content.includes('<attached:')) {
      return 'document';
    }
    if (content.includes('live location') || content.includes('location:')) {
      return 'location';
    }
    return 'text';
  }

  isForwardedMessage(content) {
    return content.includes('Forwarded') || content.includes('Переслано');
  }

  isSystemMessage(content) {
    const systemPatterns = [
      'joined using this',
      'left',
      'added',
      'removed',
      'changed the subject',
      'changed this group',
      'присоединился',
      'покинул',
      'добавил',
      'удалил',
      'изменил тему',
      'изменил настройки'
    ];

    const lowerContent = content.toLowerCase();
    return systemPatterns.some(pattern => lowerContent.includes(pattern));
  }

  generateConversationTitle(messages) {
    if (messages.length === 0) return 'WhatsApp чат';

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
    if (customerName) {
      return `Чат с ${customerName}`;
    }

    return 'WhatsApp чат';
  }
}

module.exports = new WhatsAppParser();