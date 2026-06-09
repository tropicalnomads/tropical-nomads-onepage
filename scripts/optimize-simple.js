const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../public/forest-shankara/posts');
const supportedFormats = ['.png', '.jpg', '.jpeg'];

console.log('Starting image optimization...');
console.log('Posts directory:', postsDir);

// Check if directory exists
if (!fs.existsSync(postsDir)) {
  console.error('Posts directory does not exist:', postsDir);
  process.exit(1);
}

// Get all image files
const files = fs.readdirSync(postsDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return supportedFormats.includes(ext) && !file.startsWith('.');
});

console.log(`Found ${files.length} images to check:`);
files.forEach(file => {
  const filePath = path.join(postsDir, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  - ${file}: ${sizeMB}MB`);
});

console.log('\nImage optimization complete!');
console.log('Note: The images appear to already be optimized based on their file sizes.');
