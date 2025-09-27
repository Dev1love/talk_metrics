// Demo controller with mock data for demonstration without database

const getMockGlobalMetrics = () => {
  return {
    success: true,
    data: {
      metrics: {
        total_conversations: 156,
        completed_conversations: 124,
        completion_rate: 79.5,
        avg_first_response_minutes: 8.3,
        avg_response_time_minutes: 15.7,
        booking_conversion_rate: 67.2,
        payment_conversion_rate: 45.8,
        avg_politeness_score: 0.87,
        upsell_rate: 23.1
      },
      cci_score: 78,
      interpretation: {
        level: 'Good',
        color: '#16a34a',
        description: 'Качество коммуникации находится на хорошем уровне. Есть возможности для улучшения времени ответа и конверсии.',
        recommendations: [
          'Сократите время первого ответа до 5 минут для критических запросов',
          'Улучшите процесс допродаж для увеличения upsell rate',
          'Разработайте скрипты для типичных вопросов о бронировании'
        ]
      },
      components: {
        response_time_score: 72,
        politeness_score: 87,
        completion_rate_score: 80,
        conversion_rate_score: 67,
        problem_resolution_score: 75
      }
    }
  }
}

const getMockInsights = () => {
  return {
    success: true,
    data: {
      insights: [
        {
          id: 'insight_001',
          title: 'Время ответа превышает норму в пиковые часы',
          category: 'response_time',
          priority: 'high',
          description: 'Среднее время первого ответа в период с 14:00 до 17:00 составляет 25 минут, что значительно превышает целевые 8 минут.',
          recommendation: 'Рассмотрите возможность добавления дополнительных операторов в пиковые часы или внедрите систему автоответчиков для первичной обработки запросов.',
          metric_impact: 15,
          proof_conversation_id: 'conv_001',
          is_addressed: false,
          generated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          addressed_at: null
        },
        {
          id: 'insight_002',
          title: 'Высокий уровень вежливости операторов',
          category: 'politeness',
          priority: 'low',
          description: 'Средняя оценка вежливости составляет 87%, что превышает отраслевые стандарты. Клиенты отмечают профессионализм команды.',
          recommendation: 'Продолжайте поддерживать высокие стандарты обслуживания. Рассмотрите возможность использования этого как конкурентного преимущества в маркетинге.',
          metric_impact: 5,
          proof_conversation_id: 'conv_002',
          is_addressed: true,
          generated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          addressed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'insight_003',
          title: 'Потенциал роста конверсии в оплату',
          category: 'conversion',
          priority: 'medium',
          description: 'Конверсия из бронирования в оплату составляет 68%, что ниже потенциала. Многие клиенты останавливаются на этапе предоплаты.',
          recommendation: 'Упростите процесс оплаты, добавьте больше способов платежей и создайте понятные инструкции с визуальными подсказками.',
          metric_impact: 22,
          proof_conversation_id: 'conv_003',
          is_addressed: false,
          generated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          addressed_at: null
        },
        {
          id: 'insight_004',
          title: 'Эффективные скрипты допродаж',
          category: 'conversion',
          priority: 'medium',
          description: 'Операторы успешно предлагают дополнительные услуги в 23% случаев, что показывает хорошее понимание потребностей клиентов.',
          recommendation: 'Стандартизируйте успешные подходы к upsell и обучите всех операторов лучшим практикам.',
          metric_impact: 8,
          proof_conversation_id: 'conv_004',
          is_addressed: false,
          generated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          addressed_at: null
        },
        {
          id: 'insight_005',
          title: 'Сезонные паттерны в общении',
          category: 'sentiment',
          priority: 'low',
          description: 'Анализ показывает повышение позитивности общения в выходные дни и снижение в понедельники.',
          recommendation: 'Адаптируйте тон коммуникации в зависимости от дня недели. Рассмотрите специальные предложения для понедельников.',
          metric_impact: 3,
          proof_conversation_id: null,
          is_addressed: false,
          generated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          addressed_at: null
        }
      ],
      pagination: {
        total: 5,
        page: 1,
        limit: 5,
        totalPages: 1
      }
    }
  }
}

const getMockConversations = () => {
  return {
    success: true,
    data: {
      conversations: [
        {
          id: 'conv_001',
          customer_name: 'Анна Иванова',
          status: 'completed',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 47 * 60 * 1000).toISOString(),
          messages_count: 12,
          avg_response_time: 5.2,
          first_response_time: 3.1,
          has_booking: true,
          has_payment: true,
          has_upsell: false,
          avg_politeness_score: 0.92,
          platform: 'whatsapp'
        },
        {
          id: 'conv_002',
          customer_name: 'Михаил Петров',
          status: 'completed',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 85 * 60 * 1000).toISOString(),
          messages_count: 14,
          avg_response_time: 12.5,
          first_response_time: 8.7,
          has_booking: true,
          has_payment: true,
          has_upsell: true,
          avg_politeness_score: 0.88,
          platform: 'whatsapp'
        },
        {
          id: 'conv_003',
          customer_name: 'Елена Сидорова',
          status: 'pending',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          completed_at: null,
          messages_count: 8,
          avg_response_time: 135.0,
          first_response_time: 125.0,
          has_booking: false,
          has_payment: false,
          has_upsell: false,
          avg_politeness_score: 0.75,
          platform: 'whatsapp'
        },
        {
          id: 'conv_004',
          customer_name: 'Дмитрий Козлов',
          status: 'completed',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 125 * 60 * 1000).toISOString(),
          messages_count: 20,
          avg_response_time: 7.8,
          first_response_time: 2.1,
          has_booking: true,
          has_payment: true,
          has_upsell: true,
          avg_politeness_score: 0.94,
          platform: 'telegram'
        }
      ],
      pagination: {
        total: 156,
        page: 1,
        limit: 10,
        totalPages: 16
      }
    }
  }
}

module.exports = {
  getMockGlobalMetrics,
  getMockInsights,
  getMockConversations
}