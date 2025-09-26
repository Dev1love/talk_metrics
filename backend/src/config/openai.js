const { OpenAI } = require('openai');
const logger = require('./logger');

class OpenAIConfig {
  constructor() {
    this.client = null;
    this.isEnabled = false;
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.1;

    this.initialize();
  }

  initialize() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        logger.warn('OpenAI API key not configured. AI analysis will be disabled.');
        return;
      }

      this.client = new OpenAI({
        apiKey: apiKey,
      });

      this.isEnabled = true;
      logger.info(`OpenAI client initialized with model: ${this.model}`);

    } catch (error) {
      logger.error('Failed to initialize OpenAI client:', error);
      this.isEnabled = false;
    }
  }

  async testConnection() {
    if (!this.isEnabled) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Test connection. Reply with "OK".'
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const result = response.choices[0]?.message?.content?.trim();
      logger.info('OpenAI connection test successful:', result);
      return true;

    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      throw error;
    }
  }

  async analyzeMessage(message, analysisType = 'full') {
    if (!this.isEnabled) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const prompt = this.buildPrompt(message, analysisType);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по анализу клиентского сервиса. Анализируй сообщения точно и объективно.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(result);
      return this.validateAnalysis(analysis);

    } catch (error) {
      logger.error('OpenAI message analysis failed:', error);
      throw error;
    }
  }

  buildPrompt(message, analysisType) {
    const basePrompt = `
Проанализируй следующее сообщение из чата клиентского сервиса:

"${message.content}"

Направление сообщения: ${message.direction === 'incoming' ? 'от клиента' : 'от сотрудника'}
Время: ${message.timestamp_normalized}
`;

    switch (analysisType) {
      case 'intention':
        return basePrompt + `
Определи ОСНОВНУЮ интенцию этого сообщения. Выбери ТОЛЬКО ОДНУ из категорий:
- request: общий запрос информации
- booking: бронирование/заказ услуги
- payment: вопросы/действия по оплате
- complaint: жалоба/недовольство
- upsell: предложение дополнительных услуг (только для исходящих)
- greeting: приветствие
- goodbye: прощание
- question: конкретный вопрос
- answer: ответ на вопрос
- other: не подходит под другие категории

Ответь в JSON формате:
{
  "intention": "категория",
  "confidence": 0.95,
  "reasoning": "краткое объяснение"
}`;

      case 'politeness':
        return basePrompt + `
Оцени ВЕЖЛИВОСТЬ этого сообщения по шкале от 0 до 1:
- 1.0: очень вежливо (приветствие, благодарность, извинения, уважительный тон)
- 0.8: вежливо (нейтральный вежливый тон)
- 0.6: нейтрально (без явной вежливости или грубости)
- 0.4: слегка невежливо (краткость, отсутствие вежливых форм)
- 0.2: невежливо (грубый тон, требовательность)
- 0.0: очень невежливо (оскорбления, агрессия)

Ответь в JSON формате:
{
  "politeness_score": 0.8,
  "reasoning": "краткое объяснение оценки"
}`;

      default: // full analysis
        return basePrompt + `
Проведи полный анализ сообщения:

1. Определи ОСНОВНУЮ интенцию (одну из: request, booking, payment, complaint, upsell, greeting, goodbye, question, answer, other)
2. Оцени вежливость от 0 до 1
3. Определи тональность (positive, negative, neutral)
4. Найди ключевые слова

Ответь в JSON формате:
{
  "intention": "категория",
  "intention_confidence": 0.95,
  "politeness_score": 0.8,
  "sentiment": "positive",
  "sentiment_confidence": 0.9,
  "keywords": ["слово1", "слово2"],
  "reasoning": "краткое объяснение анализа"
}`;
    }
  }

  validateAnalysis(analysis) {
    const validIntentions = [
      'request', 'booking', 'payment', 'complaint', 'upsell',
      'greeting', 'goodbye', 'question', 'answer', 'other'
    ];

    const validSentiments = ['positive', 'negative', 'neutral'];

    // Validate intention
    if (analysis.intention && !validIntentions.includes(analysis.intention)) {
      logger.warn(`Invalid intention: ${analysis.intention}, defaulting to 'other'`);
      analysis.intention = 'other';
    }

    // Validate sentiment
    if (analysis.sentiment && !validSentiments.includes(analysis.sentiment)) {
      logger.warn(`Invalid sentiment: ${analysis.sentiment}, defaulting to 'neutral'`);
      analysis.sentiment = 'neutral';
    }

    // Validate confidence scores (0-1 range)
    if (analysis.intention_confidence !== undefined) {
      analysis.intention_confidence = Math.max(0, Math.min(1, analysis.intention_confidence));
    }

    if (analysis.sentiment_confidence !== undefined) {
      analysis.sentiment_confidence = Math.max(0, Math.min(1, analysis.sentiment_confidence));
    }

    if (analysis.politeness_score !== undefined) {
      analysis.politeness_score = Math.max(0, Math.min(1, analysis.politeness_score));
    }

    // Ensure keywords is an array
    if (analysis.keywords && !Array.isArray(analysis.keywords)) {
      analysis.keywords = [];
    }

    return analysis;
  }

  async analyzeBatch(messages, analysisType = 'full', batchSize = 5) {
    if (!this.isEnabled) {
      throw new Error('OpenAI client not initialized');
    }

    const results = [];
    const errors = [];

    // Process messages in batches to avoid rate limits
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(async (message) => {
        try {
          const analysis = await this.analyzeMessage(message, analysisType);
          return { messageId: message.id, analysis, success: true };
        } catch (error) {
          logger.error(`Failed to analyze message ${message.id}:`, error);
          return { messageId: message.id, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({
            messageId: 'unknown',
            error: result.reason?.message || 'Unknown error',
            success: false
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    logger.info(`Batch analysis completed: ${results.length} successful, ${errors.length} errors`);

    return {
      results,
      errors,
      summary: {
        total: messages.length,
        successful: results.length,
        failed: errors.length,
        successRate: ((results.length / messages.length) * 100).toFixed(1)
      }
    };
  }

  getUsageStats() {
    return {
      isEnabled: this.isEnabled,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }
}

module.exports = new OpenAIConfig();