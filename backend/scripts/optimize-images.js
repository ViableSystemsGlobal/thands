const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

/**
 * Script to optimize all existing images in the uploads directory
 * Creates thumbnails, medium, and original versions in WebP format
 */

const optimizeImage = async (inputPath, outputDir, filename) => {
  try {
    const baseName = path.parse(filename).name;
    
    // Create thumbnails (300x400)
    const thumbPath = path.join(outputDir, 'thumbnails', `${baseName}-thumb.webp`);
    await sharp(inputPath)
      .resize(300, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(thumbPath);
    
    // Create medium (600x800)
    const mediumPath = path.join(outputDir, 'medium', `${baseName}-medium.webp`);
    await sharp(inputPath)
      .resize(600, 800, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(mediumPath);
    
    // Create original (WebP format)
    const originalPath = path.join(outputDir, 'original', `${baseName}-original.webp`);
    await sharp(inputPath)
      .webp({ quality: 90 })
      .toFile(originalPath);
    
    console.log(`✅ Optimized: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to optimize ${filename}:`, error.message);
    return false;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting image optimization...');
    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const productsDir = path.join(uploadsDir, 'products');
    
    // Ensure directories exist
    const dirs = ['thumbnails', 'medium', 'original'];
    for (const dir of dirs) {
      const dirPath = path.join(productsDir, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    // Get all image files in products directory
    const files = await fs.readdir(productsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file) && 
      !file.startsWith('.') &&
      !dirs.includes(file)
    );
    
    console.log(`📁 Found ${imageFiles.length} images to optimize`);
    
    if (imageFiles.length === 0) {
      console.log('✅ No images to optimize');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each image
    for (const file of imageFiles) {
      const inputPath = path.join(productsDir, file);
      const success = await optimizeImage(inputPath, productsDir, file);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\n📊 Optimization Results:');
    console.log(`✅ Successfully optimized: ${successCount} images`);
    console.log(`❌ Failed to optimize: ${failCount} images`);
    console.log(`📁 Total processed: ${imageFiles.length} images`);
    
    // Show file size comparison
    console.log('\n💾 File Size Comparison:');
    const sampleFile = imageFiles[0];
    if (sampleFile) {
      const originalPath = path.join(productsDir, sampleFile);
      const thumbPath = path.join(productsDir, 'thumbnails', `${path.parse(sampleFile).name}-thumb.webp`);
      const mediumPath = path.join(productsDir, 'medium', `${path.parse(sampleFile).name}-medium.webp`);
      
      try {
        const originalStats = await fs.stat(originalPath);
        const thumbStats = await fs.stat(thumbPath);
        const mediumStats = await fs.stat(mediumPath);
        
        console.log(`📸 ${sampleFile}:`);
        console.log(`   Original: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Thumbnail: ${(thumbStats.size / 1024).toFixed(2)} KB (${((1 - thumbStats.size / originalStats.size) * 100).toFixed(1)}% smaller)`);
        console.log(`   Medium: ${(mediumStats.size / 1024).toFixed(2)} KB (${((1 - mediumStats.size / originalStats.size) * 100).toFixed(1)}% smaller)`);
      } catch (error) {
        console.log('   Could not compare file sizes');
      }
    }
    
    console.log('\n🎉 Image optimization completed!');
    console.log('💡 Images are now served in optimized WebP format');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { optimizeImage };
