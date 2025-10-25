const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/products',
    'uploads/products/original',
    'uploads/products/thumbnails',
    'uploads/products/medium',
    'uploads/newsletter',
    'uploads/newsletter/original',
    'uploads/newsletter/thumbnails',
    'uploads/newsletter/medium',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }
};

// Initialize directories
ensureUploadDirs();

// Configure multer for memory storage (we'll process with Sharp)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Image processing function
const processImage = async (buffer, filename, type = 'product') => {
  const baseFilename = path.parse(filename).name;
  const fileId = uuidv4();
  
  const processedImages = {};

  try {
    console.log(`Processing image: ${filename}, buffer size: ${buffer.length}`);
    
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    // Test if Sharp can read the buffer
    const metadata = await sharp(buffer).metadata();
    console.log('Image metadata:', metadata);

    // Create different sizes for different use cases
    const sizes = {
      thumbnails: { width: 500, height: 600, suffix: 'thumb' },
      medium: { width: 800, height: 1000, suffix: 'medium' },
      original: { width: null, height: null, suffix: 'original' }
    };

    for (const [sizeName, config] of Object.entries(sizes)) {
      const outputPath = path.join('uploads', type, sizeName, `${fileId}-${config.suffix}.webp`);
      console.log(`Processing ${sizeName} to ${outputPath}`);
      
      let sharpInstance = sharp(buffer);
      
      // Resize if dimensions are specified
      if (config.width && config.height) {
        sharpInstance = sharpInstance.resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert to WebP format for better compression
      await sharpInstance
        .webp({ quality: 95, effort: 6 })
        .toFile(outputPath);
      
      console.log(`Successfully processed ${sizeName}`);
      
      processedImages[sizeName] = {
        path: outputPath,
        url: `/uploads/${type}/${sizeName}/${fileId}-${config.suffix}.webp`,
        size: sizeName,
        width: config.width,
        height: config.height
      };
    }

    return {
      id: fileId,
      originalName: filename,
      processedImages,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Image processing error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      filename,
      bufferLength: buffer ? buffer.length : 'no buffer'
    });
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Clean up temporary files
const cleanupTempFiles = async (files) => {
  try {
    for (const file of files) {
      if (file.path && file.path.includes('temp')) {
        await fs.unlink(file.path).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Delete uploaded file
const deleteUploadedFile = async (fileId) => {
  try {
    const sizes = ['original', 'medium', 'thumbnail'];
    
    for (const size of sizes) {
      const filePath = path.join('uploads', 'products', size, `${fileId}-${size === 'original' ? 'original' : size}.webp`);
      await fs.unlink(filePath).catch(() => {});
    }
    
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
};

// Get file info
const getFileInfo = async (fileId) => {
  try {
    const originalPath = path.join('uploads', 'products', 'original', `${fileId}-original.webp`);
    const stats = await fs.stat(originalPath);
    
    return {
      id: fileId,
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return {
      id: fileId,
      exists: false
    };
  }
};

module.exports = {
  upload,
  processImage,
  cleanupTempFiles,
  deleteUploadedFile,
  getFileInfo,
  ensureUploadDirs
};
