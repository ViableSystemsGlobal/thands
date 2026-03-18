const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Upload root: use UPLOAD_PATH env var (set to Render disk mount point in production)
// or fall back to the project root for local development
const projectRoot = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.resolve(__dirname, '..', '..');

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
    'uploads/hero',
    'uploads/hero/original',
    'uploads/hero/thumbnails',
    'uploads/hero/medium',
    'uploads/collection',
    'uploads/collection/original',
    'uploads/collection/thumbnails',
    'uploads/collection/medium',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      // Use absolute path from project root
      const fullPath = path.join(projectRoot, dir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✅ Created/verified directory: ${fullPath}`);
    } catch (error) {
      // Directory already exists, ignore
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
};

// Initialize directories
ensureUploadDirs();

// Configure multer for memory storage (we'll process with Sharp)
const storage = multer.memoryStorage();

// Validate image magic bytes (called after multer buffers the file)
const validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
};

// File filter for images only (MIME type pre-check; magic bytes validated post-buffer)
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
      // Use absolute path from project root
      const outputDir = path.join(projectRoot, 'uploads', type, sizeName);
      const outputPath = path.join(outputDir, `${fileId}-${config.suffix}.webp`);
      
      // Ensure the directory exists before writing
      await fs.mkdir(outputDir, { recursive: true });
      
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
      
      // URL is relative to the web root, not the file system
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
  ensureUploadDirs,
  validateMagicBytes
};
