const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

try {
  require("sharp");
} catch (_error) {
  console.log("Installing sharp...");
  execSync("npm install sharp", { stdio: "inherit" });
}

const sharp = require("sharp");

const editionDir = path.join(__dirname, "../public/forest-shankara/editions/1");
const sourceDir = path.join(editionDir, "source");
const galleryJsonPath = path.join(
  __dirname,
  "../src/data/forest-shankara/editions/1/gallery.json"
);

const supportedFormats = [".jpg", ".jpeg", ".png"];
const maxWidth = 1920;
const quality = 85;

function listSourceFiles() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  return fs
    .readdirSync(sourceDir)
    .filter((file) => supportedFormats.includes(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));
}

async function convertToWebp(files) {
  const outputNames = [];

  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    const fileName = path.basename(file, path.extname(file));
    const outputName = `${fileName}.webp`;
    const outputPath = path.join(editionDir, outputName);

    await sharp(inputPath)
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 6,
      })
      .toFile(outputPath);

    outputNames.push(outputName);
    console.log(`Optimized: ${outputName}`);
  }

  return outputNames;
}

function writeGalleryJson(outputNames) {
  const galleryPaths = outputNames.map(
    (name) => `/forest-shankara/editions/1/${name}`
  );
  fs.writeFileSync(galleryJsonPath, `${JSON.stringify(galleryPaths, null, 2)}\n`);
  console.log(`Updated gallery JSON: ${galleryJsonPath}`);
}

async function run() {
  const files = listSourceFiles();
  if (files.length === 0) {
    console.log("No source images found to optimize.");
    return;
  }

  console.log(`Found ${files.length} source images.`);
  const outputNames = await convertToWebp(files);
  writeGalleryJson(outputNames);
  console.log("Edition #1 gallery optimization complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
