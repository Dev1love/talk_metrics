const createCsvWriter = require('csv-writer').createObjectCsvWriter
const fs = require('fs').promises
const path = require('path')

class CSVExportService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../tmp')
  }

  async exportMetrics(metricsData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = path.join(this.tempDir, `metrics_export_${Date.now()}.csv`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      const metrics = metricsData.globalMetrics?.metrics || {}

      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' },
          { id: 'unit', title: 'Unit' },
          { id: 'description', title: 'Description' }
        ]
      })

      const records = [
        {
          metric: 'Total Conversations',
          value: metrics.total_conversations || 0,
          unit: 'count',
          description: 'Total number of conversations processed'
        },
        {
          metric: 'Completed Conversations',
          value: metrics.completed_conversations || 0,
          unit: 'count',
          description: 'Number of conversations marked as completed'
        },
        {
          metric: 'Completion Rate',
          value: Math.round((metrics.completion_rate || 0) * 100) / 100,
          unit: 'percentage',
          description: 'Percentage of conversations that were completed'
        },
        {
          metric: 'Average First Response Time',
          value: Math.round((metrics.avg_first_response_minutes || 0) * 100) / 100,
          unit: 'minutes',
          description: 'Average time for first response to customer inquiry'
        },
        {
          metric: 'Average Response Time',
          value: Math.round((metrics.avg_response_time_minutes || 0) * 100) / 100,
          unit: 'minutes',
          description: 'Average response time across all messages'
        },
        {
          metric: 'Booking Conversion Rate',
          value: Math.round((metrics.booking_conversion_rate || 0) * 100) / 100,
          unit: 'percentage',
          description: 'Percentage of conversations resulting in bookings'
        },
        {
          metric: 'Payment Conversion Rate',
          value: Math.round((metrics.payment_conversion_rate || 0) * 100) / 100,
          unit: 'percentage',
          description: 'Percentage of conversations resulting in payments'
        },
        {
          metric: 'Average Politeness Score',
          value: Math.round((metrics.avg_politeness_score || 0) * 10000) / 100,
          unit: 'percentage',
          description: 'Average politeness score from AI analysis'
        },
        {
          metric: 'Upsell Rate',
          value: Math.round((metrics.upsell_rate || 0) * 100) / 100,
          unit: 'percentage',
          description: 'Percentage of conversations with upsell attempts'
        },
        {
          metric: 'CCI Score',
          value: metricsData.globalMetrics?.cci_score || 0,
          unit: 'score (0-100)',
          description: 'Communication Quality Index score'
        }
      ]

      await csvWriter.writeRecords(records)
      return outputPath
    } catch (error) {
      console.error('CSV metrics export error:', error)
      throw new Error(`Failed to export metrics to CSV: ${error.message}`)
    }
  }

  async exportConversations(conversationsData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = path.join(this.tempDir, `conversations_export_${Date.now()}.csv`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      if (!conversationsData || conversationsData.length === 0) {
        throw new Error('No conversations data provided for export')
      }

      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'conversation_id', title: 'Conversation ID' },
          { id: 'customer_name', title: 'Customer Name' },
          { id: 'status', title: 'Status' },
          { id: 'created_at', title: 'Created At' },
          { id: 'completed_at', title: 'Completed At' },
          { id: 'messages_count', title: 'Messages Count' },
          { id: 'avg_response_time', title: 'Avg Response Time (min)' },
          { id: 'first_response_time', title: 'First Response Time (min)' },
          { id: 'has_booking', title: 'Has Booking' },
          { id: 'has_payment', title: 'Has Payment' },
          { id: 'has_upsell', title: 'Has Upsell' },
          { id: 'avg_politeness_score', title: 'Avg Politeness Score' },
          { id: 'platform', title: 'Platform' }
        ]
      })

      const records = conversationsData.map(conv => ({
        conversation_id: conv.id,
        customer_name: conv.customer_name || 'Unknown',
        status: conv.status || 'active',
        created_at: conv.created_at ? new Date(conv.created_at).toISOString() : '',
        completed_at: conv.completed_at ? new Date(conv.completed_at).toISOString() : '',
        messages_count: conv.messages_count || 0,
        avg_response_time: Math.round((conv.avg_response_time || 0) * 100) / 100,
        first_response_time: Math.round((conv.first_response_time || 0) * 100) / 100,
        has_booking: conv.has_booking ? 'Yes' : 'No',
        has_payment: conv.has_payment ? 'Yes' : 'No',
        has_upsell: conv.has_upsell ? 'Yes' : 'No',
        avg_politeness_score: Math.round((conv.avg_politeness_score || 0) * 1000) / 1000,
        platform: conv.platform || 'unknown'
      }))

      await csvWriter.writeRecords(records)
      return outputPath
    } catch (error) {
      console.error('CSV conversations export error:', error)
      throw new Error(`Failed to export conversations to CSV: ${error.message}`)
    }
  }

  async exportInsights(insightsData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = path.join(this.tempDir, `insights_export_${Date.now()}.csv`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      if (!insightsData || insightsData.length === 0) {
        throw new Error('No insights data provided for export')
      }

      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'insight_id', title: 'Insight ID' },
          { id: 'title', title: 'Title' },
          { id: 'category', title: 'Category' },
          { id: 'priority', title: 'Priority' },
          { id: 'description', title: 'Description' },
          { id: 'recommendation', title: 'Recommendation' },
          { id: 'metric_impact', title: 'Metric Impact (%)' },
          { id: 'proof_conversation_id', title: 'Proof Conversation ID' },
          { id: 'is_addressed', title: 'Is Addressed' },
          { id: 'generated_at', title: 'Generated At' },
          { id: 'addressed_at', title: 'Addressed At' }
        ]
      })

      const records = insightsData.map(insight => ({
        insight_id: insight.id,
        title: insight.title || '',
        category: insight.category || '',
        priority: insight.priority || '',
        description: insight.description || '',
        recommendation: insight.recommendation || '',
        metric_impact: insight.metric_impact || 0,
        proof_conversation_id: insight.proof_conversation_id || '',
        is_addressed: insight.is_addressed ? 'Yes' : 'No',
        generated_at: insight.generated_at ? new Date(insight.generated_at).toISOString() : '',
        addressed_at: insight.addressed_at ? new Date(insight.addressed_at).toISOString() : ''
      }))

      await csvWriter.writeRecords(records)
      return outputPath
    } catch (error) {
      console.error('CSV insights export error:', error)
      throw new Error(`Failed to export insights to CSV: ${error.message}`)
    }
  }

  async exportMessages(messagesData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = path.join(this.tempDir, `messages_export_${Date.now()}.csv`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      if (!messagesData || messagesData.length === 0) {
        throw new Error('No messages data provided for export')
      }

      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'message_id', title: 'Message ID' },
          { id: 'conversation_id', title: 'Conversation ID' },
          { id: 'sender_type', title: 'Sender Type' },
          { id: 'sender_name', title: 'Sender Name' },
          { id: 'message_text', title: 'Message Text' },
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'ai_intention', title: 'AI Intention' },
          { id: 'ai_politeness_score', title: 'AI Politeness Score' },
          { id: 'has_booking_keywords', title: 'Has Booking Keywords' },
          { id: 'has_payment_keywords', title: 'Has Payment Keywords' },
          { id: 'has_upsell_keywords', title: 'Has Upsell Keywords' }
        ]
      })

      const records = messagesData.map(msg => ({
        message_id: msg.id,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type || 'unknown',
        sender_name: msg.sender_name || 'Unknown',
        message_text: this.sanitizeText(msg.message_text || ''),
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : '',
        ai_intention: msg.ai_intention || '',
        ai_politeness_score: Math.round((msg.ai_politeness_score || 0) * 1000) / 1000,
        has_booking_keywords: msg.has_booking_keywords ? 'Yes' : 'No',
        has_payment_keywords: msg.has_payment_keywords ? 'Yes' : 'No',
        has_upsell_keywords: msg.has_upsell_keywords ? 'Yes' : 'No'
      }))

      await csvWriter.writeRecords(records)
      return outputPath
    } catch (error) {
      console.error('CSV messages export error:', error)
      throw new Error(`Failed to export messages to CSV: ${error.message}`)
    }
  }

  async exportAll(reportData, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = path.join(this.tempDir, `full_export_${Date.now()}.csv`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      // Create a comprehensive export with summary data
      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'export_type', title: 'Export Type' },
          { id: 'name', title: 'Name' },
          { id: 'value', title: 'Value' },
          { id: 'details', title: 'Details' },
          { id: 'timestamp', title: 'Timestamp' }
        ]
      })

      const records = []
      const timestamp = new Date().toISOString()

      // Add metrics
      if (reportData.globalMetrics?.metrics) {
        const metrics = reportData.globalMetrics.metrics
        Object.entries(metrics).forEach(([key, value]) => {
          records.push({
            export_type: 'Metric',
            name: key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
            value: typeof value === 'number' ? Math.round(value * 100) / 100 : value,
            details: this.getMetricDescription(key),
            timestamp
          })
        })
      }

      // Add CCI data
      if (reportData.globalMetrics?.cci_score) {
        records.push({
          export_type: 'CCI',
          name: 'Communication Quality Index',
          value: reportData.globalMetrics.cci_score,
          details: reportData.globalMetrics.interpretation?.description || '',
          timestamp
        })
      }

      // Add insights summary
      if (reportData.insights) {
        const priorityCounts = {}
        const categoryCounts = {}

        reportData.insights.forEach(insight => {
          priorityCounts[insight.priority] = (priorityCounts[insight.priority] || 0) + 1
          categoryCounts[insight.category] = (categoryCounts[insight.category] || 0) + 1
        })

        Object.entries(priorityCounts).forEach(([priority, count]) => {
          records.push({
            export_type: 'Insight Summary',
            name: `${priority} Priority Insights`,
            value: count,
            details: `Number of insights with ${priority} priority`,
            timestamp
          })
        })

        Object.entries(categoryCounts).forEach(([category, count]) => {
          records.push({
            export_type: 'Insight Summary',
            name: `${category} Category Insights`,
            value: count,
            details: `Number of insights in ${category} category`,
            timestamp
          })
        })
      }

      await csvWriter.writeRecords(records)
      return outputPath
    } catch (error) {
      console.error('CSV full export error:', error)
      throw new Error(`Failed to create full CSV export: ${error.message}`)
    }
  }

  sanitizeText(text) {
    // Remove or escape problematic characters for CSV
    return text
      .replace(/"/g, '""')  // Escape quotes
      .replace(/[\r\n]/g, ' ')  // Replace newlines with spaces
      .trim()
  }

  getMetricDescription(metricKey) {
    const descriptions = {
      'total_conversations': 'Total number of conversations processed',
      'completed_conversations': 'Number of conversations marked as completed',
      'completion_rate': 'Percentage of conversations that were completed',
      'avg_first_response_minutes': 'Average time for first response to customer inquiry',
      'avg_response_time_minutes': 'Average response time across all messages',
      'booking_conversion_rate': 'Percentage of conversations resulting in bookings',
      'payment_conversion_rate': 'Percentage of conversations resulting in payments',
      'avg_politeness_score': 'Average politeness score from AI analysis',
      'upsell_rate': 'Percentage of conversations with upsell attempts'
    }
    return descriptions[metricKey] || 'No description available'
  }
}

module.exports = CSVExportService