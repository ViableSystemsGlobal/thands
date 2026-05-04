const multer = require('multer');
let sharp;
let sharpLoadError;
try {
  sharp = require('sharp');
} catch (error) {
  sharpLoadError = error;
  console.warn('⚠️ Sharp failed to load. Image uploads will be unavailable:', error.message);
}
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Upload root: use UPLOAD_PATH env var (set to Render disk mount point in production)
// or fall back to the project root for local development
const appRoot = path.resolve(__dirname, '..', '..');
const uploadRoot = process.env.UPLOAD_PATH
  ? (path.isAbsolute(process.env.UPLOAD_PATH)
      ? process.env.UPLOAD_PATH
      : path.resolve(appRoot, process.env.UPLOAD_PATH))
  : path.join(appRoot, 'uploads');

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    '.',
    'products',
    'products/original',
    'products/thumbnails',
    'products/medium',
    'newsletter',
    'newsletter/original',
    'newsletter/thumbnails',
    'newsletter/medium',
    'hero',
    'hero/original',
    'hero/thumbnails',
    'hero/medium',
    'collection',
    'collection/original',
    'collection/thumbnails',
    'collection/medium',
    'temp'
  ];

  for (const dir of dirs) {
    try {
      // Directories are relative to the upload root served by server.js.
      const fullPath = path.join(uploadRoot, dir);
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
  if (!sharp) {
    throw new Error(`Image processing is unavailable because Sharp failed to load: ${sharpLoadError?.message || 'unknown error'}`);
  }

  const baseFilename = path.parse(filename).name;
  const fileId = uuidv4();
  const uploadType = type === 'product' ? 'products' : type;
  
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
      const outputDir = path.join(uploadRoot, uploadType, sizeName);
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
        url: `/uploads/${uploadType}/${sizeName}/${fileId}-${config.suffix}.webp`,
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
    const sizes = [
      { dir: 'original', suffix: 'original' },
      { dir: 'medium', suffix: 'medium' },
      { dir: 'thumbnails', suffix: 'thumb' }
    ];

    for (const { dir, suffix } of sizes) {
      const filePath = path.join(uploadRoot, 'products', dir, `${fileId}-${suffix}.webp`);
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
    const originalPath = path.join(uploadRoot, 'products', 'original', `${fileId}-original.webp`);
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
