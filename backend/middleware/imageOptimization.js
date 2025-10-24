const path = require('path');
const fs = require('fs').promises;

/**
 * Image optimization middleware
 * Serves optimized images based on size parameter or context
 */
const optimizeImageResponse = async (req, res, next) => {
  try {
    const imagePath = req.path;
    const { size } = req.query;
    
    // Skip if it's not an image request or no size parameter
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(imagePath) || !size) {
      return next();
    }

    // Extract filename from path
    const filename = path.basename(imagePath);
    const baseName = path.parse(filename).name;
    
    // Define size preferences based on query parameter
    let preferredSize = 'medium';
    if (size === 'thumb' || size === 'thumbnail') {
      preferredSize = 'thumbnails';
    } else if (size === 'large' || size === 'original') {
      preferredSize = 'original';
    } else {
      preferredSize = 'medium';
    }

    // Try to find optimized WebP version
    const optimizedPath = path.join(__dirname, '..', 'uploads', 'products', preferredSize, `${baseName}-${preferredSize === 'thumbnails' ? 'thumb' : preferredSize}.webp`);

    try {
      await fs.access(optimizedPath);
      
      // Set appropriate headers for optimized image
      const stats = await fs.stat(optimizedPath);
      
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('X-Image-Optimized', 'true');
      res.setHeader('X-Image-Format', 'webp');
      res.setHeader('X-Image-Size', preferredSize);

      // Serve the optimized file
      const fileStream = require('fs').createReadStream(optimizedPath);
      fileStream.pipe(res);
      return; // Don't call next()

    } catch (error) {
      // Optimized version doesn't exist, fall through to original
    }

    // Fallback to original behavior
    next();

  } catch (error) {
    console.error('Image optimization error:', error);
    // Fallback to original behavior
    next();
  }
};

module.exports = optimizeImageResponse;
