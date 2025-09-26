const PDFDocument = require('pdfkit')
const fs = require('fs').promises
const path = require('path')

class PDFReportService {
  constructor() {
    this.pageMargin = 50
    this.primaryColor = '#2563eb'
    this.secondaryColor = '#64748b'
    this.successColor = '#16a34a'
    this.warningColor = '#d97706'
    this.errorColor = '#dc2626'
  }

  async generateReport(reportData, outputPath = null) {
    try {
      const doc = new PDFDocument({
        margin: this.pageMargin,
        size: 'A4',
        info: {
          Title: 'TalkMetrics Report',
          Author: 'TalkMetrics System',
          Subject: 'Chat Analysis Report',
          Creator: 'TalkMetrics PDF Generator'
        }
      })

      // If no output path provided, create a temp file
      if (!outputPath) {
        outputPath = path.join(__dirname, `../../tmp/report_${Date.now()}.pdf`)
        // Ensure tmp directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
      }

      // Create write stream
      const stream = require('fs').createWriteStream(outputPath)
      doc.pipe(stream)

      // Generate report content
      await this.addHeader(doc, reportData)
      await this.addExecutiveSummary(doc, reportData)
      await this.addMetricsSection(doc, reportData)
      await this.addCCISection(doc, reportData)
      await this.addInsightsSection(doc, reportData)

      if (reportData.conversations && reportData.conversations.length > 0) {
        await this.addConversationsSection(doc, reportData)
      }

      await this.addFooter(doc, reportData)

      // Finalize PDF
      doc.end()

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve)
        stream.on('error', reject)
      })

      return outputPath
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF report: ${error.message}`)
    }
  }

  async addHeader(doc, reportData) {
    // Logo placeholder (could add actual logo here)
    doc.rect(this.pageMargin, this.pageMargin, 60, 40).fill(this.primaryColor)

    // Title
    doc.fontSize(24)
       .fillColor('#000000')
       .text('TalkMetrics Report', this.pageMargin + 80, this.pageMargin + 10)

    // Report info
    const currentY = this.pageMargin + 50
    doc.fontSize(10)
       .fillColor(this.secondaryColor)
       .text(`Generated: ${new Date().toLocaleDateString('ru-RU')}`, this.pageMargin + 80, currentY)
       .text(`Period: ${this.formatDateRange(reportData.dateRange)}`, this.pageMargin + 80, currentY + 15)

    // Move cursor down
    doc.y = currentY + 50
  }

  async addExecutiveSummary(doc, reportData) {
    const startY = doc.y

    // Section title
    doc.fontSize(16)
       .fillColor('#000000')
       .text('Executive Summary', this.pageMargin, startY)

    doc.y = startY + 30

    // Key metrics in a grid
    const metrics = reportData.globalMetrics?.metrics || {}
    const cci = reportData.globalMetrics?.cci_score || 0

    const boxWidth = (doc.page.width - 2 * this.pageMargin - 20) / 3
    const boxHeight = 80
    let currentX = this.pageMargin

    // Total conversations
    this.drawMetricBox(doc, currentX, doc.y, boxWidth, boxHeight,
      'Total Conversations', metrics.total_conversations || 0, this.primaryColor)

    currentX += boxWidth + 10

    // CCI Score
    const cciColor = cci >= 75 ? this.successColor : cci >= 60 ? this.warningColor : this.errorColor
    this.drawMetricBox(doc, currentX, doc.y, boxWidth, boxHeight,
      'CCI Score', `${cci}/100`, cciColor)

    currentX += boxWidth + 10

    // Completion Rate
    this.drawMetricBox(doc, currentX, doc.y, boxWidth, boxHeight,
      'Completion Rate', `${Math.round(metrics.completion_rate || 0)}%`,
      metrics.completion_rate >= 80 ? this.successColor : this.warningColor)

    doc.y += boxHeight + 20
  }

  drawMetricBox(doc, x, y, width, height, label, value, color) {
    // Box outline
    doc.rect(x, y, width, height)
       .stroke('#e2e8f0')

    // Colored top bar
    doc.rect(x, y, width, 4)
       .fill(color)

    // Label
    doc.fontSize(10)
       .fillColor(this.secondaryColor)
       .text(label, x + 10, y + 15, { width: width - 20, align: 'center' })

    // Value
    doc.fontSize(20)
       .fillColor('#000000')
       .text(value.toString(), x + 10, y + 35, { width: width - 20, align: 'center' })
  }

  async addMetricsSection(doc, reportData) {
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage()
    }

    const startY = doc.y

    doc.fontSize(16)
       .fillColor('#000000')
       .text('Key Metrics', this.pageMargin, startY)

    doc.y = startY + 30

    const metrics = reportData.globalMetrics?.metrics || {}

    // Metrics table
    const tableData = [
      ['First Response Time', `${Math.round(metrics.avg_first_response_minutes || 0)} minutes`],
      ['Average Response Time', `${Math.round(metrics.avg_response_time_minutes || 0)} minutes`],
      ['Completion Rate', `${Math.round(metrics.completion_rate || 0)}%`],
      ['Booking Conversion', `${Math.round(metrics.booking_conversion_rate || 0)}%`],
      ['Payment Conversion', `${Math.round(metrics.payment_conversion_rate || 0)}%`],
      ['Politeness Score', `${Math.round((metrics.avg_politeness_score || 0) * 100)}%`],
      ['Upsell Rate', `${Math.round(metrics.upsell_rate || 0)}%`]
    ]

    this.drawTable(doc, tableData, ['Metric', 'Value'])
  }

  async addCCISection(doc, reportData) {
    if (doc.y > 650) {
      doc.addPage()
    }

    const startY = doc.y + 20

    doc.fontSize(16)
       .fillColor('#000000')
       .text('Communication Quality Index (CCI)', this.pageMargin, startY)

    doc.y = startY + 30

    const globalMetrics = reportData.globalMetrics || {}
    const cci_score = globalMetrics.cci_score || 0
    const interpretation = globalMetrics.interpretation || {}
    const components = globalMetrics.components || {}

    // CCI Score with progress bar
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Overall CCI Score: ${cci_score}/100`, this.pageMargin, doc.y)

    doc.y += 20

    // Progress bar
    const barWidth = 200
    const barHeight = 20
    const fillWidth = (cci_score / 100) * barWidth

    doc.rect(this.pageMargin, doc.y, barWidth, barHeight)
       .stroke('#e2e8f0')
       .fill('#f8fafc')

    const barColor = cci_score >= 75 ? this.successColor : cci_score >= 60 ? this.warningColor : this.errorColor
    doc.rect(this.pageMargin, doc.y, fillWidth, barHeight)
       .fill(barColor)

    doc.y += 40

    // Interpretation
    if (interpretation.level) {
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`Level: ${interpretation.level}`, this.pageMargin, doc.y)

      doc.y += 15

      doc.fontSize(10)
         .fillColor(this.secondaryColor)
         .text(interpretation.description || '', this.pageMargin, doc.y, { width: 400 })
    }

    doc.y += 30

    // Component breakdown
    if (Object.keys(components).length > 0) {
      doc.fontSize(14)
         .fillColor('#000000')
         .text('Component Breakdown:', this.pageMargin, doc.y)

      doc.y += 20

      const componentData = [
        ['Response Time', `${components.response_time_score || 0}`, '25%'],
        ['Politeness', `${components.politeness_score || 0}`, '20%'],
        ['Completion Rate', `${components.completion_rate_score || 0}`, '20%'],
        ['Conversion Rate', `${components.conversion_rate_score || 0}`, '15%'],
        ['Problem Resolution', `${components.problem_resolution_score || 0}`, '20%']
      ]

      this.drawTable(doc, componentData, ['Component', 'Score', 'Weight'])
    }
  }

  async addInsightsSection(doc, reportData) {
    if (!reportData.insights || reportData.insights.length === 0) {
      return
    }

    if (doc.y > 600) {
      doc.addPage()
    }

    const startY = doc.y + 20

    doc.fontSize(16)
       .fillColor('#000000')
       .text('Key Insights', this.pageMargin, startY)

    doc.y = startY + 30

    // Take top 5 insights
    const topInsights = reportData.insights
      .filter(insight => !insight.is_addressed)
      .slice(0, 5)

    topInsights.forEach((insight, index) => {
      if (doc.y > 700) {
        doc.addPage()
      }

      // Priority icon (simulate with colored circle)
      const priorityColor = this.getPriorityColor(insight.priority)
      doc.circle(this.pageMargin, doc.y + 5, 4)
         .fill(priorityColor)

      // Insight title
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`${index + 1}. ${insight.title}`, this.pageMargin + 15, doc.y)

      doc.y += 18

      // Category and priority
      doc.fontSize(9)
         .fillColor(this.secondaryColor)
         .text(`${this.getCategoryLabel(insight.category)} • Priority: ${insight.priority}`, this.pageMargin + 15, doc.y)

      doc.y += 15

      // Description
      doc.fontSize(10)
         .fillColor('#000000')
         .text(insight.description, this.pageMargin + 15, doc.y, { width: 450 })

      doc.y += 20

      // Recommendation
      doc.fontSize(10)
         .fillColor(this.primaryColor)
         .text(`Recommendation: ${insight.recommendation}`, this.pageMargin + 15, doc.y, { width: 450 })

      doc.y += 25
    })
  }

  async addConversationsSection(doc, reportData) {
    if (!reportData.conversations || reportData.conversations.length === 0) {
      return
    }

    doc.addPage()

    doc.fontSize(16)
       .fillColor('#000000')
       .text('Recent Conversations', this.pageMargin, this.pageMargin)

    doc.y = this.pageMargin + 30

    // Take first 10 conversations
    const recentConversations = reportData.conversations.slice(0, 10)

    const tableData = recentConversations.map(conv => [
      conv.customer_name || 'Unknown',
      conv.status || 'active',
      `${conv.messages_count || 0}`,
      `${Math.round(conv.avg_response_time || 0)}m`,
      conv.has_booking ? 'Yes' : 'No'
    ])

    this.drawTable(doc, tableData, ['Customer', 'Status', 'Messages', 'Avg Response', 'Booking'])
  }

  drawTable(doc, data, headers) {
    const startX = this.pageMargin
    const startY = doc.y
    const rowHeight = 25
    const colWidth = (doc.page.width - 2 * this.pageMargin) / headers.length

    // Headers
    doc.fontSize(10)
       .fillColor('#000000')

    headers.forEach((header, i) => {
      const x = startX + i * colWidth
      doc.rect(x, startY, colWidth, rowHeight)
         .fill('#f1f5f9')
         .stroke('#e2e8f0')

      doc.fillColor('#000000')
         .text(header, x + 5, startY + 8, { width: colWidth - 10 })
    })

    // Data rows
    data.forEach((row, rowIndex) => {
      const y = startY + (rowIndex + 1) * rowHeight

      row.forEach((cell, colIndex) => {
        const x = startX + colIndex * colWidth
        doc.rect(x, y, colWidth, rowHeight)
           .fill(rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc')
           .stroke('#e2e8f0')

        doc.fillColor('#000000')
           .text(cell.toString(), x + 5, y + 8, { width: colWidth - 10 })
      })
    })

    doc.y = startY + (data.length + 1) * rowHeight + 20
  }

  async addFooter(doc, reportData) {
    // Go to last page bottom
    const pageHeight = doc.page.height
    doc.y = pageHeight - 60

    // Separator line
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(doc.page.width - this.pageMargin, doc.y)
       .stroke('#e2e8f0')

    doc.y += 10

    // Footer text
    doc.fontSize(8)
       .fillColor(this.secondaryColor)
       .text('Generated by TalkMetrics - AI-Powered Chat Analysis System', this.pageMargin, doc.y)
       .text(`Report ID: RPT-${Date.now()}`, doc.page.width - this.pageMargin - 120, doc.y)
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'critical':
      case 'high':
        return this.errorColor
      case 'medium':
        return this.warningColor
      case 'low':
        return this.successColor
      default:
        return this.secondaryColor
    }
  }

  getCategoryLabel(category) {
    const labels = {
      'response_time': 'Response Time',
      'politeness': 'Politeness',
      'conversion': 'Conversion',
      'sentiment': 'Sentiment',
      'completion': 'Completion'
    }
    return labels[category] || category
  }

  formatDateRange(dateRange) {
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return 'All time'
    }

    const start = new Date(dateRange.start).toLocaleDateString('ru-RU')
    const end = new Date(dateRange.end).toLocaleDateString('ru-RU')
    return `${start} - ${end}`
  }
}

module.exports = PDFReportService