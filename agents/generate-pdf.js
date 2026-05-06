// generate-pdfs.js
// Usage:   node generate-pdfs.js [rootDir]
// Example: node generate-pdfs.js .

const { readdir, stat } = require('fs').promises;
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SLIDES_FILE_NAME = 'README.slides.adoc';

async function findLectureDirectories(lecturesRoot) {
    const lectureDirectories = [];

    const weekEntries = await readdir(lecturesRoot, { withFileTypes: true });

    for (const weekEntry of weekEntries) {
        if (!weekEntry.isDirectory()) {
            continue;
        }

        const weekPath = path.join(lecturesRoot, weekEntry.name);
        const lectureEntries = await readdir(weekPath, { withFileTypes: true });

        for (const lectureEntry of lectureEntries) {
            if (!lectureEntry.isDirectory()) {
                continue;
            }

            lectureDirectories.push(path.join(weekPath, lectureEntry.name));
        }
    }

    return lectureDirectories;
}

async function generateRevealSlides(lectureDirectory) {
    const slidesPath = path.join(lectureDirectory, SLIDES_FILE_NAME);
    const outputDirectory = path.join(lectureDirectory, '.output');
    const htmlPath = path.join(outputDirectory, 'README.slides.html');

    if (fs.existsSync(htmlPath)) {
        console.log(`Skipping Reveal.js HTML because output already exists: ${htmlPath}`);
        return;
    }

    if (!fs.existsSync(slidesPath)) {
        console.warn(`⚠️  File was not found: ${slidesPath}`);
        return;
    }

    const customCssSource = path.resolve('custom.css');
    const customCssDestination = path.join(outputDirectory, 'custom.css');

    fs.mkdirSync(outputDirectory, { recursive: true });

    if (fs.existsSync(customCssSource)) {
        fs.copyFileSync(customCssSource, customCssDestination);
    } else {
        console.warn(`⚠️  custom.css was not found: ${customCssSource}`);
    }

    console.log(`⏳  Generating Reveal.js HTML for ${slidesPath}`);

    const result = spawnSync(
        'docker run --rm -v ".:/documents" -w /documents ' +
        'asciidoctor/docker-asciidoctor:latest asciidoctor-revealjs ' +
        '-r asciidoctor-diagram -a allow-uri-read ' +
        '-a revealjsdir=https://cdn.jsdelivr.net/npm/reveal.js@4 ' +
        '-a customcss=custom.css -D .output ' +
        SLIDES_FILE_NAME,
        {
            cwd: lectureDirectory,
            stdio: 'inherit',
            shell: true
        }
    );

    if (result.error) {
        console.error(`❌  Error processing ${slidesPath}:`, result.error);
    } else if (result.status !== 0) {
        console.error(`❌  Failed to generate slides for ${slidesPath}`);
    } else {
        console.log(`✅  Reveal.js HTML created for ${slidesPath}`);
    }
}

async function main() {
    const root = process.argv[2] || '../doc';
    const lecturesRoot = path.resolve(root, 'lectures');

    try {
        const stats = await stat(lecturesRoot);

        if (!stats.isDirectory()) {
            console.error(`Error: ${lecturesRoot} is not a directory`);
            process.exit(1);
        }

        const lectureDirectories = await findLectureDirectories(lecturesRoot);

        if (lectureDirectories.length === 0) {
            console.warn(`⚠️  No lecture directories found under ${lecturesRoot}`);
            return;
        }

        for (const lectureDirectory of lectureDirectories) {
            await generateRevealSlides(lectureDirectory);
        }

        console.log('All done!');
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

main();
