const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../js/data.js');
const wordImagesPath = path.join(__dirname, '../js/wordImages.js');
const imagesDir = path.join(__dirname, '../assets/images');

console.log('Starting image mapping...');

// 1. Read data.js and extract words
const dataContent = fs.readFileSync(dataPath, 'utf-8');
const words = [];
const regex = /english:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(dataContent)) !== null) {
  words.push(match[1]);
}

console.log(`Found ${words.length} words in data.js`);

// 2. Read images
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.png') || fullPath.endsWith('.jpg')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const images = getFiles(imagesDir);
console.log(`Found ${images.length} images in assets/images`);

// 3. Match images to words
const simplify = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const mapped = {};
for (const img of images) {
  const basename = path.basename(img, path.extname(img));
  const simBase = simplify(basename.replace(/^u\d+_/, '')); // remove uX_ prefix
  
  // Find matching word
  const matchedWord = words.find(w => simplify(w) === simBase);
  if (matchedWord) {
    // Relative path for web (e.g., assets/images/unit1/apple.png)
    let webPath = img.replace(path.join(__dirname, '../'), '').replace(/\\/g, '/');
    mapped[matchedWord] = webPath;
  }
}

console.log(`Successfully mapped ${Object.keys(mapped).length} images.`);

// 4. Generate new WORD_IMAGES content
let newMapString = 'const WORD_IMAGES = {\n';
const entries = Object.entries(mapped);
for (let i = 0; i < entries.length; i++) {
  const [word, imgPath] = entries[i];
  const isLast = i === entries.length - 1;
  newMapString += `  '${word.replace(/'/g, "\\'")}': '${imgPath}'${isLast ? '' : ','}\n`;
}
newMapString += '};';

// 5. Update wordImages.js
const currentContent = fs.readFileSync(wordImagesPath, 'utf-8');
const startIndex = currentContent.indexOf('const WORD_IMAGES = {');
const endIndex = currentContent.indexOf('/* Emoji fallback for ALL words */');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find WORD_IMAGES block or Emoji fallback block in wordImages.js");
  process.exit(1);
}

const before = currentContent.substring(0, startIndex);
const after = currentContent.substring(endIndex);

const finalContent = before + newMapString + '\n\n' + after;
fs.writeFileSync(wordImagesPath, finalContent, 'utf-8');

console.log('wordImages.js updated successfully!');
