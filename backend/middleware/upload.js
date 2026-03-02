const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'uploads';

// Lazy-init Supabase client so missing env vars don't crash on startup
let supabase = null;
const getSupabase = () => {
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('Supabase credentials not configured for image storage');
    supabase = createClient(url, key);
  }
  return supabase;
};

// Configure multer — memory storage so Sharp can process in-memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  },
});

/**
 * Process an image with Sharp and upload all three size variants to Supabase Storage.
 * Returns the same shape as before so routes/upload.js needs minimal changes.
 */
const processImage = async (buffer, filename, type = 'product') => {
  if (!buffer || buffer.length === 0) throw new Error('Invalid image buffer');

  const fileId = uuidv4();
  const sb = getSupabase();

  const metadata = await sharp(buffer).metadata();
  console.log(`📸 Processing image: ${filename} (${metadata.width}x${metadata.height})`);

  const sizes = {
    thumbnails: { width: 500,  height: 600,  suffix: 'thumb'    },
    medium:     { width: 800,  height: 1000, suffix: 'medium'   },
    original:   { width: null, height: null,  suffix: 'original' },
  };

  const processedImages = {};

  for (const [sizeName, config] of Object.entries(sizes)) {
    let sharpInstance = sharp(buffer);
    if (config.width && config.height) {
      sharpInstance = sharpInstance.resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const imageBuffer = await sharpInstance
      .webp({ quality: 95, effort: 6 })
      .toBuffer();

    const storagePath = `${type}/${sizeName}/${fileId}-${config.suffix}.webp`;

    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, imageBuffer, { contentType: 'image/webp', upsert: false });

    if (error) throw new Error(`Supabase upload failed (${sizeName}): ${error.message}`);

    const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(storagePath);

    processedImages[sizeName] = {
      url: publicUrl,
      size: sizeName,
      width: config.width,
      height: config.height,
    };
  }

  return {
    id: fileId,
    originalName: filename,
    processedImages,
    uploadedAt: new Date().toISOString(),
  };
};

/**
 * Extract the UUID fileId from any image URL (local path or Supabase URL).
 * Filename format: <uuid>-<suffix>.webp  — UUID is always the first 5 hyphen-groups.
 */
const extractFileId = (url) => {
  const filename = url.split('/').pop();          // e.g. "abc123-...-original.webp"
  return filename.split('-').slice(0, 5).join('-'); // rejoin UUID parts
};

/**
 * Delete all three size variants of a file from Supabase Storage.
 * Accepts either a raw fileId (UUID) or a full URL.
 */
const deleteUploadedFile = async (fileIdOrUrl, type = 'product') => {
  try {
    const sb = getSupabase();
    const fileId = fileIdOrUrl.startsWith('http') ? extractFileId(fileIdOrUrl) : fileIdOrUrl;

    const paths = [
      `${type}/thumbnails/${fileId}-thumb.webp`,
      `${type}/medium/${fileId}-medium.webp`,
      `${type}/original/${fileId}-original.webp`,
    ];

    const { error } = await sb.storage.from(BUCKET).remove(paths);
    if (error) console.error('⚠️  Supabase delete error:', error.message);
    return !error;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
};

/**
 * Check whether a file exists in Supabase Storage.
 */
const getFileInfo = async (fileIdOrUrl, type = 'product') => {
  try {
    const sb = getSupabase();
    const fileId = fileIdOrUrl.startsWith('http') ? extractFileId(fileIdOrUrl) : fileIdOrUrl;
    const folder = `${type}/original`;

    const { data } = await sb.storage.from(BUCKET).list(folder, {
      search: `${fileId}-original.webp`,
    });

    const exists = !!(data && data.length > 0);
    return { id: fileId, exists };
  } catch {
    return { id: fileIdOrUrl, exists: false };
  }
};

module.exports = { upload, processImage, deleteUploadedFile, getFileInfo, extractFileId };
