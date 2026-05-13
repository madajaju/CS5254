#!/usr/bin/env node
// Generate narrated videos for lecture slide decks.
//
// Usage:
//   node generate-video.js [root|week|lecture] [elevenlabs-api-key] [--student-voice <voice>] [--output <file>]
//
// Defaults:
//   root: ../doc
//   api key: ELEVENLABS_API_KEY
//
// The input may be:
//   - a doc root containing lectures/week*/lecture directories
//   - a lectures root containing week*/lecture directories
//   - a week directory containing lecture directories
//   - a single lecture directory containing README.slides.adoc and README.convo.json

const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const SLIDES_ADOC = 'README.slides.adoc';
const SLIDES_HTML = 'README.slides.html';
const CONVO_JSON = 'README.convo.json';
const LEGACY_CONVO_JSON = 'conversation.json';
const OUTPUT_DIR = '.output';
const AUDIO_DIR = '.audio';
const SEGMENTS_DIR = '.segments';
const SLIDE_SIZE = '1280x720';

const studentVoices = [
    {name: 'kwame', id: 'hWu69umB1qADVIH5FmKg'},
    {name: 'marcus_tran', id: 'FxAB7jzo4AXQjfHq0VOF'},
    {name: 'elena', id: 'vcZLpNRPHiqtsaL8bhFW'},
    {name: 'elliot', id: 'Ifu36BnEjjIY932etsqk'},
    {name: 'gabrielle', id: 'hEuCerMJZlLixJRRBrnE'},
];

const teacherVoiceId = '85J9QS6iIte4nuZrrQR6'; // Dr. Darren

function die(message) {
    console.error(`\nERROR: ${message}`);
    process.exit(1);
}

function run(command, args, options = {}) {
    console.log(`\n>>> ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, {stdio: 'inherit', ...options});
    if (result.error) {
        die(result.error.message);
    }
    if (result.status !== 0) {
        die(`Command exited with status ${result.status}`);
    }
}

function parseArgs(argv) {
    const positional = [];
    const options = {
        studentVoice: process.env.STUDENT_VOICE || '',
        output: '',
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--student-voice') {
            options.studentVoice = argv[index + 1] || '';
            index += 1;
            continue;
        }
        if (arg === '--output') {
            options.output = argv[index + 1] || '';
            index += 1;
            continue;
        }
        positional.push(arg);
    }

    return {
        target: positional[0] || '../doc',
        apiKey: positional[1] || process.env.ELEVENLABS_API_KEY || '',
        ...options,
    };
}

function resolveStudentVoice(voiceNameOrId, fallbackIndex = 0) {
    const fallback = studentVoices[fallbackIndex % studentVoices.length];
    if (!voiceNameOrId) {
        return fallback;
    }

    const normalized = voiceNameOrId.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const namedVoice = studentVoices.find(voice => voice.name === normalized);
    if (namedVoice) {
        return namedVoice;
    }

    return {name: voiceNameOrId, id: voiceNameOrId};
}

function isLectureDirectory(directory) {
    return fs.existsSync(path.join(directory, SLIDES_ADOC)) ||
        fs.existsSync(path.join(directory, CONVO_JSON)) ||
        fs.existsSync(path.join(directory, LEGACY_CONVO_JSON));
}

function childDirectories(directory) {
    return fs.readdirSync(directory, {withFileTypes: true})
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => path.join(directory, entry.name))
        .sort((a, b) => a.localeCompare(b));
}

function discoverLectureDirectories(target) {
    const resolvedTarget = path.resolve(target);
    if (!fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isDirectory()) {
        die(`Target directory not found: ${resolvedTarget}`);
    }

    if (isLectureDirectory(resolvedTarget)) {
        return [resolvedTarget];
    }

    const lecturesRoot = fs.existsSync(path.join(resolvedTarget, 'lectures'))
        ? path.join(resolvedTarget, 'lectures')
        : resolvedTarget;

    const directLectureDirs = childDirectories(lecturesRoot).filter(isLectureDirectory);
    if (directLectureDirs.length > 0) {
        return directLectureDirs;
    }

    const weekLectureDirs = childDirectories(lecturesRoot)
        .flatMap(weekDir => childDirectories(weekDir).filter(isLectureDirectory));

    if (weekLectureDirs.length === 0) {
        die(`No lecture directories found under: ${resolvedTarget}`);
    }

    return weekLectureDirs;
}

function ensureRevealHtml(lectureDirectory) {
    const slidesPath = path.join(lectureDirectory, SLIDES_ADOC);
    const outputDirectory = path.join(lectureDirectory, OUTPUT_DIR);
    const htmlPath = path.join(outputDirectory, SLIDES_HTML);

    fs.mkdirSync(outputDirectory, {recursive: true});

    if (fs.existsSync(htmlPath)) {
        return htmlPath;
    }

    const customCssSource = path.resolve(__dirname, 'custom.css');
    if (fs.existsSync(customCssSource)) {
        fs.copyFileSync(customCssSource, path.join(outputDirectory, 'custom.css'));
    }

    if (!fs.existsSync(slidesPath)) {
        die(`Missing ${SLIDES_ADOC}: ${lectureDirectory}`);
    }

    run('docker', [
        'run', '--rm',
        '-v', `${lectureDirectory}:/documents`,
        '-w', '/documents',
        'asciidoctor/docker-asciidoctor:latest',
        'asciidoctor-revealjs',
        '-r', 'asciidoctor-diagram',
        '-a', 'allow-uri-read',
        '-a', 'revealjsdir=https://cdn.jsdelivr.net/npm/reveal.js@4',
        '-a', 'customcss=custom.css',
        '-D', OUTPUT_DIR,
        SLIDES_ADOC,
    ]);

    if (!fs.existsSync(htmlPath)) {
        die(`Reveal HTML was not generated: ${htmlPath}`);
    }

    return htmlPath;
}

function outputVideoPath(lectureDirectory, outputOverride) {
    return outputOverride
        ? path.resolve(outputOverride)
        : path.join(lectureDirectory, '.output','output.mp4');
}

function shouldBuildVideo(outputVideo) {
    if (!fs.existsSync(outputVideo)) {
        return {
            build: true,
            reason: 'missing output video',
        };
    }

    return {
        build: false,
        reason: `${path.basename(outputVideo)} already exists`,
    };
}

function captureSlidePngs(lectureDirectory) {
    const outputDirectory = path.join(lectureDirectory, OUTPUT_DIR);
    const htmlPath = ensureRevealHtml(lectureDirectory);
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    const existingPngFiles = existingSlidePngs(outputDirectory);

    if (existingPngFiles.length > 0) {
        console.log(`Reusing ${existingPngFiles.length} existing slide PNG(s).`);
        return existingPngFiles;
    }

    run('npx', [
        '--yes', 'decktape', 'reveal',
        '--screenshots',
        '--screenshots-directory', '.',
        '--screenshots-format', 'png',
        '--screenshots-size', SLIDE_SIZE,
        '-s', SLIDE_SIZE,
        fileUrl,
        'slides.pdf',
    ], {cwd: outputDirectory, shell: true});

    const pngFiles = existingSlidePngs(outputDirectory);

    if (pngFiles.length === 0) {
        die(`No slide PNGs were generated in: ${outputDirectory}`);
    }

    return pngFiles;
}

function existingSlidePngs(outputDirectory) {
    if (!fs.existsSync(outputDirectory)) {
        return [];
    }

    return fs.readdirSync(outputDirectory)
        .filter(file => /^slides_\d+_\d+x\d+\.png$/.test(file))
        .sort((a, b) => {
            const aNumber = Number(a.match(/^slides_(\d+)_/)[1]);
            const bNumber = Number(b.match(/^slides_(\d+)_/)[1]);
            return aNumber - bNumber;
        })
        .map(file => path.join(outputDirectory, file));
}

function conversationPath(lectureDirectory) {
    const preferred = path.join(lectureDirectory, CONVO_JSON);
    if (fs.existsSync(preferred)) {
        return preferred;
    }

    const legacy = path.join(lectureDirectory, LEGACY_CONVO_JSON);
    if (fs.existsSync(legacy)) {
        return legacy;
    }

    die(`Missing ${CONVO_JSON}: ${lectureDirectory}`);
}

function buildConvoForSlide(slide, studentVoiceId) {
    return slide.dialogue.map(entry => ({
        voiceId: entry.role === 'student' ? studentVoiceId : teacherVoiceId,
        text: entry.text,
    }));
}

function normalizeAudio(inputAudio, outputAudio) {
    run('ffmpeg', [
        '-y',
        '-i', inputAudio,
        '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5',
        outputAudio,
    ]);
}

function generateAudioFiles(lectureDirectory, apiKey, studentVoice) {
    const outputDirectory = path.join(lectureDirectory, OUTPUT_DIR);
    const audioDirectory = path.join(lectureDirectory, AUDIO_DIR);
    const sourceConversationPath = conversationPath(lectureDirectory);
    const conversation = JSON.parse(fs.readFileSync(sourceConversationPath, 'utf8'));
    const audioFiles = [];

    fs.mkdirSync(outputDirectory, {recursive: true});
    fs.mkdirSync(audioDirectory, {recursive: true});

    for (const slide of conversation) {
        const slideNumber = slide.slide;
        const slideConvoPath = path.join(lectureDirectory, 'convo.json');
        const slideAudioPath = path.join(outputDirectory, `slide_${slideNumber}.mp3`);

        if (fs.existsSync(slideAudioPath)) {
            console.log(`Reusing existing audio: ${slideAudioPath}`);
            audioFiles.push(slideAudioPath);
            continue;
        }

        fs.writeFileSync(
            slideConvoPath,
            JSON.stringify(buildConvoForSlide(slide, studentVoice.id), null, 2),
            'utf8'
        );

        run('docker', [
            'run', '--rm',
            '-v', `${lectureDirectory}:/work`,
            'madajaju/generate-convo-voices',
            '/work/convo.json',
            apiKey,
            '/work/.audio',
        ]);

        const producedAudio = path.join(audioDirectory, 'convo.mp3');
        const normalizedAudio = path.join(audioDirectory, 'convo_normalized.mp3');

        if (!fs.existsSync(producedAudio)) {
            die(`No audio file produced for slide ${slideNumber}`);
        }

        normalizeAudio(producedAudio, normalizedAudio);
        fs.copyFileSync(normalizedAudio, slideAudioPath);
        audioFiles.push(slideAudioPath);

        for (const file of fs.readdirSync(audioDirectory)) {
            fs.unlinkSync(path.join(audioDirectory, file));
        }
    }

    return audioFiles;
}

function createVideoSegments(lectureDirectory, pngFiles, audioFiles) {
    const segmentsDirectory = path.join(lectureDirectory, SEGMENTS_DIR);
    const pairCount = Math.min(pngFiles.length, audioFiles.length);
    const segmentFiles = [];

    if (pairCount === 0) {
        die(`No slide/audio pairs are available for: ${lectureDirectory}`);
    }

    if (pngFiles.length !== audioFiles.length) {
        console.warn(`WARNING: ${path.basename(lectureDirectory)} has ${pngFiles.length} PNG(s) and ${audioFiles.length} audio file(s). Using ${pairCount} pair(s).`);
    }

    fs.mkdirSync(segmentsDirectory, {recursive: true});

    for (let index = 0; index < pairCount; index += 1) {
        const segmentPath = path.join(segmentsDirectory, `segment_${String(index + 1).padStart(3, '0')}.mp4`);
        segmentFiles.push(segmentPath);

        if (fs.existsSync(segmentPath)) {
            console.log(`Reusing existing video segment: ${segmentPath}`);
            continue;
        }

        run('ffmpeg', [
            '-y',
            '-loop', '1',
            '-i', pngFiles[index],
            '-i', audioFiles[index],
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            segmentPath,
        ]);
    }

    return segmentFiles;
}

function concatenateSegments(lectureDirectory, segmentFiles, outputOverride) {
    const segmentsDirectory = path.join(lectureDirectory, SEGMENTS_DIR);
    const outputVideo = outputVideoPath(lectureDirectory, outputOverride);
    const concatListPath = path.join(segmentsDirectory, 'concat.txt');

    if (fs.existsSync(outputVideo)) {
        console.log(`Reusing existing output video: ${outputVideo}`);
        return outputVideo;
    }

    const concatContent = segmentFiles
        .map(file => `file '${file.replace(/\\/g, '/')}'`)
        .join('\n');

    fs.writeFileSync(concatListPath, concatContent, 'utf8');

    run('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        outputVideo,
    ]);

    return outputVideo;
}

function generateLectureVideo(lectureDirectory, apiKey, studentVoice, outputOverride) {
    console.log(`\n=== ${lectureDirectory} ===`);
    console.log(`Student voice: ${studentVoice.name} (${studentVoice.id})`);

    const videoPath = outputVideoPath(lectureDirectory, outputOverride);
    const buildDecision = shouldBuildVideo(videoPath);

    if (!buildDecision.build) {
        console.log(`Skipping video build: ${buildDecision.reason}`);
        return false;
    }

    ensureRevealHtml(lectureDirectory);
    conversationPath(lectureDirectory);

    if (!apiKey) {
        die(`Missing ElevenLabs API key; needed because ${buildDecision.reason}. Pass it as an argument or set ELEVENLABS_API_KEY.`);
    }

    console.log(`Building video: ${buildDecision.reason}`);

    const pngFiles = captureSlidePngs(lectureDirectory);
    const audioFiles = generateAudioFiles(lectureDirectory, apiKey, studentVoice);
    const segmentFiles = createVideoSegments(lectureDirectory, pngFiles, audioFiles);
    const outputVideo = concatenateSegments(lectureDirectory, segmentFiles, outputOverride);

    console.log(`\nCreated video: ${outputVideo}`);
    cleanupTemp(lectureDirectory);
    return true;
}
function cleanupTemp(lectureDirectory) {
    const tempDir = path.join(lectureDirectory, '.segments');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    const tempDir2 = path.join(lectureDirectory, '.audio');
    if (fs.existsSync(tempDir2)) {
        fs.rmSync(tempDir2, { recursive: true, force: true });
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const lectureDirectories = discoverLectureDirectories(options.target);
    if (options.output && lectureDirectories.length > 1) {
        die('--output can only be used when generating a single lecture video.');
    }

    console.log(`Lectures found: ${lectureDirectories.length}`);

    let builtCount = 0;
    let skippedCount = 0;

    lectureDirectories.forEach((lectureDirectory, index) => {
        const videoPath = outputVideoPath(lectureDirectory, options.output);
        const buildDecision = shouldBuildVideo(videoPath);

        if (!buildDecision.build) {
            console.log(`Skipping video build: ${buildDecision.reason}`);
            return false;
        }

        ensureRevealHtml(lectureDirectory);
        conversationPath(lectureDirectory);

        const studentVoice = resolveStudentVoice(options.studentVoice, index);
        if (generateLectureVideo(lectureDirectory, options.apiKey, studentVoice, options.output)) {
            builtCount += 1;
        } else {
            skippedCount += 1;
        }
    });

    console.log(`\nVideo generation complete. Built: ${builtCount}. Skipped: ${skippedCount}.`);
}

main();
