const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function migrateImages() {
  try {
    console.log('🔄 Starting image migration...');
    
    // Get all products with Supabase image URLs
    const result = await pool.query(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url LIKE '%supabase%'
    `);
    
    console.log(`📊 Found ${result.rows.length} products with Supabase URLs`);
    
    if (result.rows.length === 0) {
      console.log('✅ No Supabase URLs found. Migration not needed.');
      return;
    }
    
    // Check what images are actually available locally
    const uploadsDir = path.join(__dirname, 'uploads', 'products');
    const availableImages = new Map();
    
    // Scan all subdirectories for images
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (/\.(png|jpg|jpeg|webp|gif)$/i.test(file)) {
          const fullPath = path.join(dir, file);
          const relativePath = path.relative(uploadsDir, fullPath);
          availableImages.set(file, relativePath);
        }
      });
    };
    
    // Scan original, medium, thumbnails directories
    scanDirectory(path.join(uploadsDir, 'original'));
    scanDirectory(path.join(uploadsDir, 'medium'));
    scanDirectory(path.join(uploadsDir, 'thumbnails'));
    scanDirectory(uploadsDir); // Also check root products directory
    
    console.log(`📁 Found ${availableImages.size} local images:`);
    availableImages.forEach((path, filename) => {
      console.log(`   ${filename} -> ${path}`);
    });
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each product
    for (const product of result.rows) {
      const supabaseUrl = product.image_url;
      const filename = supabaseUrl.split('/').pop();
      
      console.log(`\n🔍 Processing: ${product.name}`);
      console.log(`   Supabase URL: ${supabaseUrl}`);
      console.log(`   Extracted filename: ${filename}`);
      
      // Try to find matching local image
      let localPath = null;
      
      // Direct filename match
      if (availableImages.has(filename)) {
        localPath = availableImages.get(filename);
      } else {
        // Try to find similar filename (in case of slight differences)
        for (const [availableFile, availablePath] of availableImages) {
          if (availableFile.includes(filename.split('.')[0]) || 
              filename.includes(availableFile.split('.')[0])) {
            localPath = availablePath;
            console.log(`   ⚠️  Using similar file: ${availableFile}`);
            break;
          }
        }
      }
      
      if (localPath) {
        // Update database with local path
        const newImageUrl = `products/${localPath}`;
        
        await pool.query(`
          UPDATE products 
          SET image_url = $1 
          WHERE id = $2
        `, [newImageUrl, product.id]);
        
        console.log(`   ✅ Updated to: ${newImageUrl}`);
        updatedCount++;
      } else {
        console.log(`   ❌ No local image found for: ${filename}`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⚠️  Skipped: ${skippedCount} products`);
    
    if (skippedCount > 0) {
      console.log(`\n💡 To fix skipped products:`);
      console.log(`   1. Upload missing images to backend/uploads/products/`);
      console.log(`   2. Run this script again`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateImages();
