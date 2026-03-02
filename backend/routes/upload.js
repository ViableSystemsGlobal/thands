const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload, processImage, deleteUploadedFile, getFileInfo, extractFileId } = require('../middleware/upload');
const { query } = require('../config/database');

const router = express.Router();

// Upload single image
router.post('/single', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImage = await processImage(
      req.file.buffer,
      req.file.originalname,
      'product'
    );

    res.json({
      message: 'Image uploaded successfully',
      file: processedImage
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

// Upload multiple images (increased limit to 50 for bulk uploads)
router.post('/multiple', authenticateToken, upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const processedImages = [];

    // Process each image
    for (const file of req.files) {
      try {
        const processedImage = await processImage(
          file.buffer,
          file.originalname,
          'product'
        );
        processedImages.push(processedImage);
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        // Continue processing other images even if one fails
      }
    }

    if (processedImages.length === 0) {
      return res.status(500).json({ error: 'Failed to process any images' });
    }

    res.json({
      message: `${processedImages.length} image(s) uploaded successfully`,
      files: processedImages
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

// Delete uploaded file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Check if file exists
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    const deleted = await deleteUploadedFile(fileId);
    
    if (deleted) {
      // Remove any references to this file in the database
      await query('UPDATE products SET image_url = NULL WHERE image_url LIKE $1', [`%${fileId}%`]);
      
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: error.message || 'Delete failed' 
    });
  }
});

// Get file info
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await getFileInfo(fileId);

    if (!fileInfo.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file: fileInfo });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get file info' 
    });
  }
});

// Update product image
router.put('/product/:productId', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if product exists
    const productResult = await query('SELECT id, image_url FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldImageUrl = productResult.rows[0].image_url;

    // Process the new image
    const processedImage = await processImage(
      req.file.buffer,
      req.file.originalname,
      'product'
    );

    // Update product with new Supabase image URL
    const newImageUrl = processedImage.processedImages.original.url;
    await query('UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newImageUrl, productId]);

    // Delete old image from Supabase Storage
    if (oldImageUrl) {
      try {
        const oldFileId = extractFileId(oldImageUrl);
        await deleteUploadedFile(oldFileId, 'product');
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    res.json({
      message: 'Product image updated successfully',
      productId,
      newImageUrl,
      file: processedImage
    });

  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({ 
      error: error.message || 'Update failed' 
    });
  }
});

// List uploaded files (admin only)
router.get('/', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get files from database (we'll track them in a files table later)
    // For now, we'll scan the directory
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const filesDir = path.join('uploads', 'products', 'original');
      const files = await fs.readdir(filesDir);
      
      const fileList = [];
      for (const file of files.slice(offset, offset + parseInt(limit))) {
        const fileId = file.split('-')[0];
        const fileInfo = await getFileInfo(fileId);
        if (fileInfo.exists) {
          fileList.push({
            id: fileId,
            filename: file,
            url: `/uploads/products/original/${file}`,
            ...fileInfo
          });
        }
      }

      res.json({
        files: fileList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: files.length,
          hasMore: offset + parseInt(limit) < files.length
        }
      });

    } catch (error) {
      res.json({
        files: [],
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total: 0,
          hasMore: false
        }
      });
    }

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to list files' 
    });
  }
});

// Upload hero image
router.post('/hero', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImage = await processImage(
      req.file.buffer,
      req.file.originalname,
      'hero'
    );

    res.json({
      success: true,
      url: processedImage.processedImages.original.url,
      imageUrl: processedImage.processedImages.original.url,
      message: 'Hero image uploaded successfully'
    });

  } catch (error) {
    console.error('Hero image upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

// Upload collection image
router.post('/collection', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImage = await processImage(
      req.file.buffer,
      req.file.originalname,
      'collection'
    );

    res.json({
      success: true,
      url: processedImage.processedImages.original.url,
      imageUrl: processedImage.processedImages.original.url,
      message: 'Collection image uploaded successfully'
    });

  } catch (error) {
    console.error('Collection image upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

// Upload newsletter image
router.post('/newsletter', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImage = await processImage(
      req.file.buffer,
      req.file.originalname,
      'newsletter'
    );

    res.json({
      success: true,
      url: processedImage.processedImages.original.url,
      imageUrl: processedImage.processedImages.original.url,
      message: 'Newsletter image uploaded successfully'
    });

  } catch (error) {
    console.error('Newsletter image upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

module.exports = router;