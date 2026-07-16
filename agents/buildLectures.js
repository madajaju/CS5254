const fs = require('fs/promises');
const path = require('path');
const AIHelper = require('./AIHelper.js');

const DEFAULT_LECTURES_DIR = path.resolve(__dirname, '../doc/lectures');
const DEFAULT_PROMPT_FILE = path.resolve(__dirname, './lectureBuild.md');
const DEFAULT_TRANSCRIPT_PROMPT_FILE = path.resolve(__dirname, './transcriptCreator.md');
const DEFAULT_CONVO_PROMPT_FILE = path.resolve(__dirname, './convoCreator.md');

async function main() {
    const lecturesDir = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_LECTURES_DIR;

    const promptFile = process.argv[3]
        ? path.resolve(process.argv[3])
        : DEFAULT_PROMPT_FILE;

    const transcriptPromptFile = process.argv[4]
        ? path.resolve(process.argv[4])
        : DEFAULT_TRANSCRIPT_PROMPT_FILE;

    const convoPromptFile = process.argv[5]
        ? path.resolve(process.argv[5])
        : DEFAULT_CONVO_PROMPT_FILE;

    console.log(`Using lectures directory: ${lecturesDir}`);
    console.log(`Using lecture build prompt: ${promptFile}`);
    console.log(`Using transcript creator prompt: ${transcriptPromptFile}`);
    console.log(`Using convo creator prompt: ${convoPromptFile}`);

    const systemPrompt = await fs.readFile(promptFile, 'utf8');
    const transcriptSystemPrompt = await fs.readFile(transcriptPromptFile, 'utf8');
    const convoSystemPrompt = await fs.readFile(convoPromptFile, 'utf8');
    const readmeFiles = await findReadmeFiles(lecturesDir);

    if (readmeFiles.length === 0) {
        console.log('No README.md files found.');
        return;
    }

    console.log(`Found ${readmeFiles.length} README.md file(s).`);

    for (const readmeFile of readmeFiles) {
        await buildLecture(readmeFile, systemPrompt);
        await transcriptCreator(readmeFile, transcriptSystemPrompt);
        // await convoCreator(readmeFile, convoSystemPrompt);
    }

    console.log('Lecture build complete.');
}

async function findReadmeFiles(directory) {
    const results = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            const nestedResults = await findReadmeFiles(fullPath);
            results.push(...nestedResults);
        } else if (entry.isFile() && entry.name === 'README.md') {
            results.push(fullPath);
        }
    }

    return results;
}

async function buildLecture(readmeFile, systemPrompt) {
    console.log(`Building lecture: ${readmeFile}`);

    const originalReadme = await fs.readFile(readmeFile, 'utf8');

    if (!originalReadme.trim()) {
        console.warn(`Skipping empty README.md: ${readmeFile}`);
        return;
    }

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: originalReadme
        }
    ];

    const generatedLecture = await AIHelper.ask(messages);

    if (!generatedLecture || !generatedLecture.trim()) {
        console.warn(`Skipping write because generated lecture was empty: ${readmeFile}`);
        return;
    }

    await fs.writeFile(readmeFile, generatedLecture, 'utf8');

    console.log(`Updated: ${readmeFile}`);
}

async function transcriptCreator(readmeFile, transcriptSystemPrompt) {
    const lectureDirectory = path.dirname(readmeFile);
    const slidesFile = path.join(lectureDirectory, 'README.slides.adoc');
    const transcriptOutputFile = path.join(lectureDirectory, 'README.transcript.json');

    console.log(`Creating transcript for: ${lectureDirectory}`);

    const readmeExists = await fileExists(readmeFile);
    const slidesExist = await fileExists(slidesFile);

    if (!readmeExists) {
        console.warn(`README.md file was not found: ${readmeFile}`);
        return;
    }

    if (!slidesExist) {
        console.warn(`README.slides.adoc file was not found: ${slidesFile}`);
        return;
    }

    const readmeContent = await fs.readFile(readmeFile, 'utf8');
    const slidesContent = await fs.readFile(slidesFile, 'utf8');

    if (!readmeContent.trim()) {
        console.warn(`Skipping transcript because README.md is empty: ${readmeFile}`);
        return;
    }

    if (!slidesContent.trim()) {
        console.warn(`Skipping transcript because README.slides.adoc is empty: ${slidesFile}`);
        return;
    }

    const messages = [
        {
            role: 'system',
            content: transcriptSystemPrompt
        },
        {
            role: 'user',
            content: [
                '# Lecture README.md',
                '',
                '```markdown',
                readmeContent,
                '```',
                '',
                '# Slide Deck README.slides.adoc',
                '',
                '```adoc',
                slidesContent,
                '```',
                '',
                'Generate the transcript JSON array now.'
            ].join('\n')
        }
    ];

    const transcriptArray = await AIHelper.askForCode(messages);

    if (!transcriptArray) {
        console.warn(`Skipping write because generated transcript was empty: ${lectureDirectory}`);
        return;
    }

    await fs.writeFile(
        transcriptOutputFile,
        JSON.stringify(transcriptArray, null, 2),
        'utf8'
    );

    console.log(`Updated: ${transcriptOutputFile}`);
}


async function fileExists(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}


main().catch((error) => {
    console.error('Failed to build lectures.');
    console.error(error);
    process.exit(1);
});