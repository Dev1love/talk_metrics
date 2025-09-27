const FileUpload = require('../models/FileUpload');
const chatParserService = require('../services/chatParserService');
const logger = require('../config/logger');
const { cleanupFiles } = require('../middleware/uploadHandler');

class UploadController {
  async uploadFiles(req, res) {
    try {
      const { platform } = req.body;
      const files = req.files;

      logger.info('Upload request received:', {
        platform,
        files: files ? files.length : 0,
        body: req.body
      });

      if (!files || files.length === 0) {
        logger.error('No files in request');
        return res.status(400).json({
          success: false,
          error: { message: 'No files uploaded' }
        });
      }

      logger.info(`Processing ${files.length} files for platform: ${platform}`);

      const results = [];

      for (const file of files) {
        try {
          logger.info(`Processing file: ${file.originalname}`, {
            size: file.size,
            mimetype: file.mimetype,
            platform: platform,
            path: file.path
          });

          // Create upload record
          let upload;
          try {
            upload = await FileUpload.createUpload({
              filename: file.originalname,
              size: file.size,
              type: file.type,
              platform: platform
            });
            logger.info(`Upload record created with ID: ${upload.id}`);
          } catch (dbError) {
            console.error('DATABASE ERROR creating upload record:', dbError.message);
            throw new Error(`Database error: ${dbError.message}`);
          }

          // Update status to processing
          await FileUpload.updateProcessingStatus(upload.id, 'processing');

          logger.info(`Starting file parsing for ${file.originalname}`);

          // Process the file
          const stats = await chatParserService.parseFile(file, platform, upload.id);

          logger.info(`File parsing completed for ${file.originalname}`, stats);

          // Update status to completed with stats
          await FileUpload.updateProcessingStatus(upload.id, 'completed', null, stats);

          results.push({
            uploadId: upload.id,
            filename: file.originalname,
            status: 'completed',
            stats
          });

          logger.info(`Successfully processed file: ${file.originalname}`, stats);

        } catch (error) {
          logger.error(`Failed to process file ${file.originalname}:`, {
            error: error.message,
            stack: error.stack,
            file: file.originalname,
            platform: platform
          });

          // Update status to failed
          if (upload && upload.id) {
            await FileUpload.updateProcessingStatus(upload.id, 'failed', error.message);
          }

          results.push({
            uploadId: upload?.id || null,
            filename: file.originalname,
            status: 'failed',
            error: error.message
          });
        }
      }

      // Clean up uploaded files from disk
      await cleanupFiles(files);

      const successCount = results.filter(r => r.status === 'completed').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      res.status(200).json({
        success: true,
        data: {
          message: `Processed ${files.length} files: ${successCount} successful, ${failCount} failed`,
          results,
          summary: {
            total: files.length,
            successful: successCount,
            failed: failCount
          }
        }
      });

    } catch (error) {
      logger.error('Upload processing error:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });

      console.error('UPLOAD ERROR:', error.message);
      console.error('STACK:', error.stack);

      // Clean up files in case of general error
      if (req.files) {
        await cleanupFiles(req.files);
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process uploads',
          details: error.message // Always show error details for debugging
        }
      });
    }
  }

  async getUploadHistory(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      let uploads;
      if (status) {
        uploads = await FileUpload.getUploadsByStatus(status);
      } else {
        uploads = await FileUpload.findAll({}, 'uploaded_at DESC', parseInt(limit));
      }

      // Apply offset if provided
      if (offset > 0) {
        uploads = uploads.slice(parseInt(offset));
      }

      res.status(200).json({
        success: true,
        data: {
          uploads,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: uploads.length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get upload history:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve upload history'
        }
      });
    }
  }

  async getUploadDetails(req, res) {
    try {
      const { uploadId } = req.params;

      const upload = await FileUpload.findById(uploadId);

      if (!upload) {
        return res.status(404).json({
          success: false,
          error: { message: 'Upload not found' }
        });
      }

      // Get additional stats if upload is completed
      let stats = null;
      if (upload.upload_status === 'completed') {
        stats = await FileUpload.getUploadStats(uploadId);
      }

      res.status(200).json({
        success: true,
        data: {
          upload,
          stats
        }
      });

    } catch (error) {
      logger.error('Failed to get upload details:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve upload details'
        }
      });
    }
  }

  async deleteUpload(req, res) {
    try {
      const { uploadId } = req.params;

      const upload = await FileUpload.findById(uploadId);

      if (!upload) {
        return res.status(404).json({
          success: false,
          error: { message: 'Upload not found' }
        });
      }

      await FileUpload.delete(uploadId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Upload deleted successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to delete upload:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete upload'
        }
      });
    }
  }
}

module.exports = new UploadController();