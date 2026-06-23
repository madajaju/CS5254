const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.resolve(REPO_ROOT, 'doc', 'lecture.adoc');
const DEFAULT_OUTPUT_DIR = path.resolve(REPO_ROOT, 'doc', '.output');
const DEFAULT_OUTPUT_FILE = path.join(DEFAULT_OUTPUT_DIR, 'lecture.html');
const DEFAULT_CUSTOM_CSS_SOURCE = path.resolve(__dirname, 'custom.css');
const DEFAULT_CUSTOM_CSS_TARGET = path.join(DEFAULT_OUTPUT_DIR, 'custom.css');
const REVEALJS_DIR = 'https://cdn.jsdelivr.net/npm/reveal.js@4';

function toPosixPath(filePath) {
    return filePath.split(path.sep).join('/');
}

async function main() {
    const sourceFile = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_SOURCE;

    const outputDir = process.argv[3]
        ? path.resolve(process.argv[3])
        : DEFAULT_OUTPUT_DIR;

    const outputFile = process.argv[4]
        ? path.resolve(process.argv[4])
        : DEFAULT_OUTPUT_FILE;

    const customCssSource = process.argv[5]
        ? path.resolve(process.argv[5])
        : DEFAULT_CUSTOM_CSS_SOURCE;

    const customCssTarget = path.join(outputDir, path.basename(customCssSource));

    if (!fs.existsSync(sourceFile)) {
        console.error(`Source lecture not found: ${sourceFile}`);
        process.exit(1);
    }

    await fsPromises.mkdir(outputDir, { recursive: true });

    if (fs.existsSync(customCssSource)) {
        fs.copyFileSync(customCssSource, customCssTarget);
    } else {
        console.warn(`custom.css not found at: ${customCssSource}`);
    }

    console.log(`Building Reveal.js HTML from: ${sourceFile}`);
    console.log(`Output directory: ${outputDir}`);

    const dockerArgs = [
        'run',
        '--rm',
        '-v', `${REPO_ROOT}:/documents`,
        '-w', '/documents',
        'asciidoctor/docker-asciidoctor:latest',
        'asciidoctor-revealjs',
        '-r', 'asciidoctor-diagram',
        '-a', 'allow-uri-read',
        '-a', `revealjsdir=${REVEALJS_DIR}`,
        '-a', `customcss=${path.basename(customCssTarget)}`,
        '-D', toPosixPath(path.relative(REPO_ROOT, outputDir)),
        toPosixPath(path.relative(REPO_ROOT, sourceFile)),
    ];

    const result = spawnSync('docker', dockerArgs, {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        shell: false,
    });

    if (result.error) {
        console.error('Docker failed to start:', result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        console.error(`asciidoctor-revealjs failed with exit code ${result.status}`);
        process.exit(result.status ?? 1);
    }

    if (!fs.existsSync(outputFile)) {
        console.warn(`Build finished but output file was not found: ${outputFile}`);
        process.exit(1);
    }

    console.log(`Created: ${outputFile}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
