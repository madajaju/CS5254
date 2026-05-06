// generate-png.js
// Walks all .output directories under rootDir, finds README.marp.html files,
// and exports each slide as a PNG using decktape.
//
// Usage:   node generate-png.js [rootDir]
// Example: node generate-png.js .
//
// Output:  slides_1_1280x720.png, slides_2_1280x720.png, ... in each .output dir
//          alongside a slides.pdf (required by decktape, can be discarded)

const { readdir, stat } = require('fs').promises;
const { spawnSync } = require('child_process');
const { join, resolve } = require('path');
const fs = require('fs');
const path = require('path');

const SLIDE_SIZE = '1280x720';
const HTML_FILENAME = 'README.marp.html';
const OUTPUT_DIRNAME = '.output';

async function traverseAndCapture(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and hidden dirs other than .output
      if (entry.name === 'node_modules') continue;
      await traverseAndCapture(fullPath);
    } else if (entry.isFile() && entry.name === HTML_FILENAME && path.basename(dir) === OUTPUT_DIRNAME) {
      await captureSlides(dir, fullPath);
    }
  }
}

async function captureSlides(outputDir, htmlFile) {
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');
  console.log(`📸  Capturing slides for: ${htmlFile}`);

  // decktape must run with CWD = outputDir so that --screenshots-directory "."
  // resolves correctly (decktape prepends the screenshots-directory to the path).
  const result = spawnSync(
    'npx',
    [
      '--yes', 'decktape', 'reveal',
      '--screenshots',
      '--screenshots-directory', '.',
      '--screenshots-format', 'png',
      '--screenshots-size', SLIDE_SIZE,
      '-s', SLIDE_SIZE,
      fileUrl,
      'slides.pdf',
    ],
    { cwd: outputDir, stdio: 'inherit', shell: true }
  );

  if (result.error) {
    console.error(`❌  Error processing ${htmlFile}:`, result.error);
  } else {
    const pngs = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
    console.log(`✅  ${pngs.length} PNG(s) created in ${outputDir}`);
  }
}

(async () => {
  const root = process.argv[2] || '.';
  try {
    const stats = await stat(root);
    if (!stats.isDirectory()) {
      console.error(`Error: ${root} is not a directory`);
      process.exit(1);
    }
    await traverseAndCapture(resolve(root));
    console.log('All done!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
