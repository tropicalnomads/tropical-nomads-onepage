const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is installed, if not install it
try {
  require('sharp');
} catch (error) {
  console.log('Installing sharp...');
  execSync('npm install sharp', { stdio: 'inherit' });
}

const sharp = require('sharp');

const postsDir = path.join(__dirname, '../public/forest-shankara/posts');
const supportedFormats = ['.png', '.jpg', '.jpeg'];

// Get all image files
const files = fs.readdirSync(postsDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return supportedFormats.includes(ext) && !file.startsWith('.');
});

console.log(`Found ${files.length} images to optimize:`);
files.forEach(file => console.log(`  - ${file}`));

// Create backup directory
const backupDir = path.join(postsDir, 'backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log('Created backup directory');
}

// Function to get file size in MB
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

// Process each image
async function optimizeImages() {
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

  for (const file of files) {
    const inputPath = path.join(postsDir, file);
    const originalSize = getFileSize(inputPath);
    totalOriginalSize += parseFloat(originalSize);

    console.log(`\nProcessing: ${file} (${originalSize}MB)`);

    try {
      // Create backup
      const backupPath = path.join(backupDir, file);
      fs.copyFileSync(inputPath, backupPath);

      // Get file info
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Convert to WebP with optimization
      const fileName = path.basename(file, path.extname(file));
      const outputPath = path.join(postsDir, `${fileName}.webp`);
      
      await image
        .webp({ 
          quality: 85, // Good balance between quality and size
          effort: 6,   // Higher effort for better compression
          lossless: false
        })
        .toFile(outputPath);

      const optimizedSize = getFileSize(outputPath);
      totalOptimizedSize += parseFloat(optimizedSize);
      
      const savings = ((parseFloat(originalSize) - parseFloat(optimizedSize)) / parseFloat(originalSize) * 100).toFixed(1);
      
      console.log(`  ✓ Optimized: ${fileName}.webp (${optimizedSize}MB) - ${savings}% smaller`);
      
      // Remove original file
      fs.unlinkSync(inputPath);
      
      processedCount++;
      
    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n=== Optimization Summary ===`);
  console.log(`Processed: ${processedCount}/${files.length} images`);
  console.log(`Original total size: ${totalOriginalSize.toFixed(2)}MB`);
  console.log(`Optimized total size: ${totalOptimizedSize.toFixed(2)}MB`);
  console.log(`Total savings: ${((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log(`Space saved: ${(totalOriginalSize - totalOptimizedSize).toFixed(2)}MB`);
  console.log(`\nBackups saved in: ${backupDir}`);
}

// Run optimization
optimizeImages().catch(console.error);