const express = require('express')
const fs = require('fs').promises
const path = require('path')
const PDFReportService = require('../services/pdfReportService')
const CSVExportService = require('../services/csvExportService')
const metricsService = require('../services/metricsCalculationService')
// const insightsService = require('../services/insightsGenerationService')

const router = express.Router()

// Initialize services
const pdfService = new PDFReportService()
const csvService = new CSVExportService()
// metricsService is already an instance
// insightsService is already an instance

/**
 * Generate PDF report
 * POST /api/export/pdf
 */
router.post('/pdf', async (req, res) => {
  try {
    console.log('Generating PDF report...')

    const {
      format = 'pdf',
      includeCharts = true,
      includeInsights = true,
      includeConversations = false,
      dateRange = null
    } = req.body

    // Gather data for the report
    const reportData = await gatherReportData(dateRange, includeConversations)

    // Generate PDF
    const pdfPath = await pdfService.generateReport(reportData)

    // Read the generated file
    const pdfBuffer = await fs.readFile(pdfPath)

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="talkmetrics-report-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length
    })

    // Send PDF
    res.send(pdfBuffer)

    // Clean up temporary file
    try {
      await fs.unlink(pdfPath)
    } catch (cleanupError) {
      console.error('Error cleaning up PDF file:', cleanupError)
    }

    console.log('PDF report generated successfully')

  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({
      error: 'Failed to generate PDF report',
      message: error.message
    })
  }
})

/**
 * Generate CSV export
 * POST /api/export/csv
 */
router.post('/csv', async (req, res) => {
  try {
    console.log('Generating CSV export...')

    const {
      type = 'metrics', // metrics, conversations, insights, messages, all
      dateRange = null
    } = req.body

    let csvPath
    let filename

    switch (type) {
      case 'metrics':
        const reportData = await gatherReportData(dateRange, false)
        csvPath = await csvService.exportMetrics(reportData)
        filename = `talkmetrics-metrics-${Date.now()}.csv`
        break

      case 'conversations':
        const conversations = await getConversationsForExport(dateRange)
        csvPath = await csvService.exportConversations(conversations)
        filename = `talkmetrics-conversations-${Date.now()}.csv`
        break

      case 'insights':
        const insights = await getInsightsForExport(dateRange)
        csvPath = await csvService.exportInsights(insights)
        filename = `talkmetrics-insights-${Date.now()}.csv`
        break

      case 'messages':
        const messages = await getMessagesForExport(dateRange)
        csvPath = await csvService.exportMessages(messages)
        filename = `talkmetrics-messages-${Date.now()}.csv`
        break

      case 'all':
        const allData = await gatherReportData(dateRange, true)
        csvPath = await csvService.exportAll(allData)
        filename = `talkmetrics-full-export-${Date.now()}.csv`
        break

      default:
        return res.status(400).json({
          error: 'Invalid export type',
          message: 'Type must be one of: metrics, conversations, insights, messages, all'
        })
    }

    // Read the generated file
    const csvBuffer = await fs.readFile(csvPath)

    // Set response headers
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': csvBuffer.length
    })

    // Send CSV
    res.send(csvBuffer)

    // Clean up temporary file
    try {
      await fs.unlink(csvPath)
    } catch (cleanupError) {
      console.error('Error cleaning up CSV file:', cleanupError)
    }

    console.log('CSV export generated successfully')

  } catch (error) {
    console.error('CSV export error:', error)
    res.status(500).json({
      error: 'Failed to generate CSV export',
      message: error.message
    })
  }
})

/**
 * Get export formats and options
 * GET /api/export/formats
 */
router.get('/formats', async (req, res) => {
  try {
    const formats = {
      pdf: {
        name: 'PDF Report',
        description: 'Comprehensive report with charts and visualizations',
        options: {
          includeCharts: {
            type: 'boolean',
            default: true,
            description: 'Include charts and graphs in the report'
          },
          includeInsights: {
            type: 'boolean',
            default: true,
            description: 'Include AI insights and recommendations'
          },
          includeConversations: {
            type: 'boolean',
            default: false,
            description: 'Include detailed conversation data'
          }
        }
      },
      csv: {
        name: 'CSV Export',
        description: 'Raw data export for further analysis',
        types: {
          metrics: 'Key metrics and KPIs',
          conversations: 'Conversation-level data',
          insights: 'AI-generated insights',
          messages: 'Individual message data',
          all: 'Comprehensive data export'
        }
      }
    }

    res.json({
      success: true,
      formats
    })

  } catch (error) {
    console.error('Error fetching export formats:', error)
    res.status(500).json({
      error: 'Failed to fetch export formats',
      message: error.message
    })
  }
})

/**
 * Get export status/history
 * GET /api/export/history
 */
router.get('/history', async (req, res) => {
  try {
    // This would typically come from a database
    // For now, return mock data
    const history = [
      {
        id: 'exp_001',
        type: 'pdf',
        filename: 'talkmetrics-report-2024-01-15.pdf',
        size: 1254567,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      },
      {
        id: 'exp_002',
        type: 'csv',
        filename: 'talkmetrics-metrics-2024-01-15.csv',
        size: 45678,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      }
    ]

    res.json({
      success: true,
      exports: history
    })

  } catch (error) {
    console.error('Error fetching export history:', error)
    res.status(500).json({
      error: 'Failed to fetch export history',
      message: error.message
    })
  }
})

// Helper functions
async function gatherReportData(dateRange, includeConversations = false) {
  try {
    // Get global metrics
    const globalMetrics = await metricsService.getGlobalMetrics(dateRange)

    // Get insights
    const insights = await getInsightsForExport(dateRange)

    const reportData = {
      dateRange,
      globalMetrics,
      insights,
      generatedAt: new Date().toISOString()
    }

    if (includeConversations) {
      reportData.conversations = await getConversationsForExport(dateRange, 20) // Limit for PDF
    }

    return reportData

  } catch (error) {
    console.error('Error gathering report data:', error)
    throw new Error('Failed to gather report data')
  }
}

async function getConversationsForExport(dateRange, limit = null) {
  try {
    // Mock data - in real implementation would query database
    const mockConversations = [
      {
        id: 'conv_001',
        customer_name: 'Анна Иванова',
        status: 'completed',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        messages_count: 12,
        avg_response_time: 5.2,
        first_response_time: 3.1,
        has_booking: true,
        has_payment: true,
        has_upsell: false,
        avg_politeness_score: 0.85,
        platform: 'whatsapp'
      },
      {
        id: 'conv_002',
        customer_name: 'Михаил Петров',
        status: 'active',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        completed_at: null,
        messages_count: 8,
        avg_response_time: 12.5,
        first_response_time: 8.7,
        has_booking: true,
        has_payment: false,
        has_upsell: true,
        avg_politeness_score: 0.92,
        platform: 'telegram'
      }
    ]

    return limit ? mockConversations.slice(0, limit) : mockConversations

  } catch (error) {
    console.error('Error getting conversations for export:', error)
    throw new Error('Failed to get conversations data')
  }
}

async function getInsightsForExport(dateRange) {
  try {
    // Mock data - in real implementation would use insightsService or query database directly
    const mockInsights = [
      {
        id: 'insight_001',
        title: 'Время ответа превышает норму',
        category: 'response_time',
        priority: 'high',
        description: 'Среднее время первого ответа составляет 25 минут, что превышает целевые 15 минут.',
        recommendation: 'Рассмотрите возможность добавления дополнительных операторов в пиковые часы.',
        metric_impact: 12,
        proof_conversation_id: 'conv_001',
        is_addressed: false,
        generated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        addressed_at: null
      },
      {
        id: 'insight_002',
        title: 'Высокий уровень вежливости операторов',
        category: 'politeness',
        priority: 'low',
        description: 'Средняя оценка вежливости составляет 92%, что выше среднего.',
        recommendation: 'Продолжайте поддерживать высокие стандарты обслуживания.',
        metric_impact: 3,
        proof_conversation_id: 'conv_002',
        is_addressed: true,
        generated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        addressed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]

    return mockInsights

  } catch (error) {
    console.error('Error getting insights for export:', error)
    throw new Error('Failed to get insights data')
  }
}

async function getMessagesForExport(dateRange) {
  try {
    // Mock data - in real implementation would query database
    const mockMessages = [
      {
        id: 'msg_001',
        conversation_id: 'conv_001',
        sender_type: 'customer',
        sender_name: 'Анна Иванова',
        message_text: 'Здравствуйте! Меня интересует бронирование номера на выходные.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ai_intention: 'booking_inquiry',
        ai_politeness_score: 0.9,
        has_booking_keywords: true,
        has_payment_keywords: false,
        has_upsell_keywords: false
      },
      {
        id: 'msg_002',
        conversation_id: 'conv_001',
        sender_type: 'agent',
        sender_name: 'Оператор',
        message_text: 'Добро пожаловать! С удовольствием помогу с бронированием. На какие даты вас интересует номер?',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
        ai_intention: 'information_request',
        ai_politeness_score: 0.95,
        has_booking_keywords: false,
        has_payment_keywords: false,
        has_upsell_keywords: false
      }
    ]

    return mockMessages

  } catch (error) {
    console.error('Error getting messages for export:', error)
    throw new Error('Failed to get messages data')
  }
}

module.exports = router