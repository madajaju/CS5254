const fs = require('fs/promises');
const path = require('path');
const AIHelper = require('./AIHelper.js');

const DEFAULT_LECTURES_DIR = path.resolve(__dirname, '../doc/lectures');
const DEFAULT_PROMPT_FILE = path.resolve(__dirname, './generateSlides.md');
const DEFAULT_TRANSCRIPT_PROMPT = path.resolve(__dirname, './transcriptCreator.md');
const DEFAULT_CONVO_PROMPT_FILE = path.resolve(__dirname, './convoCreator.md');
const MAX_SLIDE_REPAIR_ATTEMPTS = 3;
const MAX_JSON_SCHEMA_REPAIR_ATTEMPTS = 3;
const TARGET_DIAGRAM_RATIO = 0.5;
const MIN_REGENERATE_DIAGRAM_RATIO = 0.45;

async function main() {
    const lecturesDir = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_LECTURES_DIR;

    const promptFile = process.argv[3]
        ? path.resolve(process.argv[3])
        : DEFAULT_PROMPT_FILE;

    const transcriptPromptFile = process.argv[4]
        ? path.resolve(process.argv[4])
        : DEFAULT_TRANSCRIPT_PROMPT;

    const convoPromptFile = process.argv[5]
        ? path.resolve(process.argv[5])
        : DEFAULT_CONVO_PROMPT_FILE;

    console.log(`Using lectures directory: ${lecturesDir}`);
    console.log(`Using slide generation prompt: ${promptFile}`);
    console.log(`Using slide transcript prompt: ${transcriptPromptFile}`);
    console.log(`Using conversation prompt: ${convoPromptFile}`);

    const systemPrompt = await fs.readFile(promptFile, 'utf8');
    const transcriptPrompt = await fs.readFile(transcriptPromptFile, 'utf8');
    const convoPrompt = await fs.readFile(convoPromptFile, 'utf8');
    const readmeFiles = await findReadmeFiles(lecturesDir);

    if (readmeFiles.length === 0) {
        console.log('No README.md files found.');
        return;
    }

    console.log(`Found ${readmeFiles.length} README.md file(s).`);

    for (const readmeFile of readmeFiles) {
        try {
            /*
            const lectureDirectory = path.dirname(readmeFile);
            if (!(await shouldBuildRenderedSlides(lectureDirectory))) {
                console.log(`Skipping slide build for ${lectureDirectory} because .output/README.slides.html is up to date.`);
                continue;
            }

             */
            const slidesBuilt = await buildSlides(readmeFile, systemPrompt);
            if (!slidesBuilt) {
                console.warn(`Skipping transcript and convo because slide generation failed: ${readmeFile}`);
                continue;
            }

            const transcriptBuilt = await transcriptCreator(readmeFile, transcriptPrompt);
            if (!transcriptBuilt) {
                console.warn(`Skipping convo because transcript generation failed: ${readmeFile}`);
                continue;
            }

            await convoCreator(readmeFile, convoPrompt);
        } catch (error) {
            console.error(`Failed while processing ${readmeFile}.`);
            console.error(error);
        }
    }

    console.log('Slide generation complete.');
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

async function buildSlides(readmeFile, systemPrompt) {
    console.log(`Generating slides for: ${readmeFile}`);

    const lectureDirectory = path.dirname(readmeFile);
    const outputFile = path.join(lectureDirectory, 'README.slides.adoc');

    if (await fileExists(outputFile)) {
        const existingSlides = await fs.readFile(outputFile, 'utf8');
        const existingValidation = validateSlides(existingSlides);
        if (existingValidation.valid) {
            const existingDiagramDensity = getDiagramDensity(existingSlides);
            if (!existingDiagramDensity.meetsTarget) {
                console.warn(`Regenerating slides because diagram density is below target: ${outputFile}`);
                console.warn(getDiagramDensityMessage(existingDiagramDensity));
            } else {
                console.log(`Skipping slide generation because valid output already exists: ${outputFile}`);
                return true;
            }
        } else {
            console.warn(`Regenerating slides because existing output is invalid: ${outputFile}`);
            console.warn(existingValidation.reason);
        }
    }

    const readmeContent = await fs.readFile(readmeFile, 'utf8');

    if (!readmeContent.trim()) {
        console.warn(`Skipping empty README.md: ${readmeFile}`);
        return false;
    }

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: readmeContent
        }
    ];

    let generatedSlides = normalizeGeneratedAdoc(await AIHelper.ask(messages));

    if (!generatedSlides || !generatedSlides.trim()) {
        console.warn(`Skipping write because generated slides were empty: ${readmeFile}`);
        return false;
    }

    let slideValidation = validateSlides(generatedSlides);
    let repairAttempt = 0;

    while (!slideValidation.valid && repairAttempt < MAX_SLIDE_REPAIR_ATTEMPTS) {
        repairAttempt++;
        const slidesBeforeRepair = generatedSlides;
        console.warn(`Repairing generated slides for ${readmeFile} because: ${slideValidation.reason}`);

        generatedSlides = normalizeGeneratedAdoc(await repairSlides({
            readmeContent,
            currentSlides: generatedSlides,
            validationReason: slideValidation.reason,
            repairAttempt
        }));

        if (!generatedSlides || !generatedSlides.trim()) {
            console.warn(`Slide repair returned empty content: ${readmeFile}`);
            generatedSlides = slidesBeforeRepair;
            break;
        }

        slideValidation = validateSlides(generatedSlides);
    }

    if (!slideValidation.valid) {
        console.warn(`Writing best available slides after ${repairAttempt} repair attempt(s), even though validation still fails: ${readmeFile}`);
        console.warn(slideValidation.reason);
    }

    let finalDiagramDensity = getDiagramDensity(generatedSlides);
    if (!finalDiagramDensity.meetsTarget) {
        console.warn(`Generated slide deck is below the target diagram density. Regenerating once with a visual-first prompt: ${outputFile}`);
        console.warn(getDiagramDensityMessage(finalDiagramDensity));

        const regeneratedSlides = normalizeGeneratedAdoc(await regenerateSlides({
            readmeContent,
            validationReason: `Diagram density ${finalDiagramDensity.diagramSlides}/${finalDiagramDensity.slideCount} is below the target ratio ${TARGET_DIAGRAM_RATIO}. Generate more diagram-only PlantUML slides.`
        }));

        if (regeneratedSlides && regeneratedSlides.trim()) {
            let regeneratedValidation = validateSlides(regeneratedSlides);
            let regeneratedAttempt = 0;
            generatedSlides = regeneratedSlides;

            while (!regeneratedValidation.valid && regeneratedAttempt < MAX_SLIDE_REPAIR_ATTEMPTS) {
                regeneratedAttempt++;
                console.warn(`Repairing visual-first regenerated slides for ${readmeFile} because: ${regeneratedValidation.reason}`);
                generatedSlides = normalizeGeneratedAdoc(await repairSlides({
                    readmeContent,
                    currentSlides: generatedSlides,
                    validationReason: regeneratedValidation.reason,
                    repairAttempt: regeneratedAttempt
                }));
                regeneratedValidation = validateSlides(generatedSlides);
            }

            if (!regeneratedValidation.valid) {
                console.warn(`Visual-first regeneration still has validation issues: ${regeneratedValidation.reason}`);
            }
        }

        finalDiagramDensity = getDiagramDensity(generatedSlides);
        if (!finalDiagramDensity.meetsTarget) {
            console.warn(`Final slide deck is still below the target diagram density: ${outputFile}`);
            console.warn(getDiagramDensityMessage(finalDiagramDensity));
        }
    }

    await fs.writeFile(outputFile, generatedSlides, 'utf8');

    console.log(`Updated: ${outputFile}`);
    return true;
}

function normalizeGeneratedAdoc(content) {
    if (typeof content !== 'string') {
        return '';
    }

    const trimmed = content.trim();
    const fence = trimmed.match(/^```(?:adoc|asciidoc|text)?\s*([\s\S]*?)\s*```\s*$/i);
    return fence ? fence[1].trim() : trimmed;
}

async function repairSlides({ readmeContent, currentSlides, validationReason, repairAttempt }) {
    const messages = [
        {
            role: 'system',
            content: [
                'You repair Reveal.js AsciiDoc slide decks.',
                'Return ONLY the corrected README.slides.adoc contents.',
                'Do not include Markdown fences or explanations.',
                '',
                'The corrected deck must preserve the lecture substance while satisfying these layout rules:',
                '* Use exactly one document title line beginning with = .',
                '* Use only == for slide headings.',
                '* Use AsciiDoc list depth markers at column 1: *, **, ***.',
                '* Do not use indented nested bullets.',
                '* No more than 6 top-level bullets on a text slide.',
                '* No more than 8 bullet lines total on a text slide.',
                '* Code slides may contain only the slide heading and one source block.',
                '* Table slides must use [cols="1,1,1,1", options="header"], |===, rows, then closing |===.',
                '* Do not use Markdown table syntax or Markdown separator rows like |---|---|.',
                '* Do not combine PlantUML with bullets, tables, source blocks, or columns.',
                '* Do not combine tables or source blocks with bullets.',
                '* Aim for at least half of the deck to be diagram-only PlantUML slides, but do not break layout rules to force it.',
                '* Add separate diagram-only slides for concepts, failure scenarios, workflows, and design responses when possible.',
                '* If a slide has too much content, split it into multiple slides.',
                '* If a slide directly compares two short concepts, use exactly two [.column] blocks.',
                '* Do not use columns for PlantUML, code, or nested lists.',
                '',
                'Allowed repair strategies:',
                '* Split one crowded slide into two or three smaller slides.',
                '* Move a PlantUML diagram to its own diagram-only slide.',
                '* Convert before/after, risk/response, symptom/cause, or option comparisons into two columns.',
                '* Shorten bullets to compact phrases.',
                '* Replace dense nested bullets with separate slides.',
                '',
                `Repair attempt: ${repairAttempt}`
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                '# Validation failure',
                validationReason,
                '',
                '# Original lecture README.md',
                '',
                '```markdown',
                readmeContent,
                '```',
                '',
                '# Current README.slides.adoc to repair',
                '',
                '```adoc',
                currentSlides,
                '```',
                '',
                'Return the full corrected README.slides.adoc now.'
            ].join('\n')
        }
    ];

    return AIHelper.ask(messages);
}

async function regenerateSlides({ readmeContent, validationReason }) {
    const messages = [
        {
            role: 'system',
            content: [
                'You generate Reveal.js AsciiDoc slide decks from lecture README files.',
                'Return ONLY the README.slides.adoc contents.',
                'Do not include Markdown fences or explanations.',
                '',
                'The previous deck failed validation. Generate a fresh, simpler deck that passes these hard rules:',
                '* Use exactly one document title line beginning with = .',
                '* Use only == for slide headings.',
                '* Use no === headings.',
                '* Use AsciiDoc list markers at column 1 only: *, **, ***.',
                '* Do not use indented bullets or Markdown - bullets.',
                '* Each slide must use one layout only: text, diagram, table, code, or two-column comparison.',
                '* A PlantUML slide may contain only the heading and PlantUML block.',
                '* A table slide may contain only the heading and table.',
                '* Tables must use [cols="1,1,1,1", options="header"], an opening |===, AsciiDoc rows, and a closing |===.',
                '* Never use Markdown table syntax or Markdown separator rows like |---|---|.',
                '* A code slide may contain only the heading and one source block.',
                '* Text slides may contain at most 6 top-level bullets and 8 bullet lines total.',
                '* Column slides must use exactly two [.column] blocks and no nested bullets.',
                '* Aim for at least half of the deck to be diagram-only PlantUML slides.',
                '* Use separate PlantUML slides for major concepts, examples, failure scenarios, and design responses.',
                '* Split aggressively. Prefer more small slides over one crowded slide.',
                '',
                `Validation failure to avoid: ${validationReason}`
            ].join('\n')
        },
        {
            role: 'user',
            content: readmeContent
        }
    ];

    return AIHelper.ask(messages);
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
        return false;
    }

    if (!slidesExist) {
        console.warn(`README.slides.adoc file was not found: ${slidesFile}`);
        return false;
    }

    const readmeContent = await fs.readFile(readmeFile, 'utf8');
    const slidesContent = await fs.readFile(slidesFile, 'utf8');

    if (!readmeContent.trim()) {
        console.warn(`Skipping transcript because README.md is empty: ${readmeFile}`);
        return false;
    }

    if (!slidesContent.trim()) {
        console.warn(`Skipping transcript because README.slides.adoc is empty: ${slidesFile}`);
        return false;
    }

    const slideCount = countSlides(slidesContent);

    if (await fileExists(transcriptOutputFile)) {
        const existingTranscript = await readExistingJsonArray(transcriptOutputFile);
        const existingValidationReason = getTranscriptValidationReason(existingTranscript, slideCount);
        if (!existingValidationReason) {
            console.log(`Skipping transcript generation because valid output already exists: ${transcriptOutputFile}`);
            return true;
        }
        console.warn(`Regenerating transcript because existing output is invalid: ${transcriptOutputFile}`);
        console.warn(existingValidationReason);
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

    let transcriptArray = await AIHelper.askForCode(messages);
    let validationReason = getTranscriptValidationReason(transcriptArray, slideCount);

    for (let repairAttempt = 1; validationReason && repairAttempt <= MAX_JSON_SCHEMA_REPAIR_ATTEMPTS; repairAttempt++) {
        console.warn(`Repairing transcript JSON for ${transcriptOutputFile} because: ${validationReason}`);
        transcriptArray = await repairStructuredJson({
            kind: 'transcript',
            validationReason,
            slideOutline: getSlideOutline(slidesContent),
            currentJson: transcriptArray,
            sourceBlocks: [
                ['Lecture README.md', readmeContent],
                ['Slide Deck README.slides.adoc', slidesContent]
            ],
            schemaRules: [
                'Return a JSON array only.',
                'The array length must match the slide outline exactly.',
                'Each entry must have slide:number, topic:string, and text:string.',
                'Slide numbers and topics must match the slide outline exactly.'
            ]
        });
        validationReason = getTranscriptValidationReason(transcriptArray, slideCount);
    }

    const finalTranscriptValidationReason = getTranscriptValidationReason(transcriptArray, slideCount);
    if (finalTranscriptValidationReason) {
        console.warn(`Writing best available transcript after ${MAX_JSON_SCHEMA_REPAIR_ATTEMPTS} repair attempt(s), even though validation still fails: ${transcriptOutputFile}`);
        console.warn(finalTranscriptValidationReason);
    }

    await fs.writeFile(
        transcriptOutputFile,
        JSON.stringify(transcriptArray, null, 2),
        'utf8'
    );

    console.log(`Updated: ${transcriptOutputFile}`);
    return true;
}

async function convoCreator(readmeFile, convoSystemPrompt) {
    const lectureDirectory = path.dirname(readmeFile);
    const slidesFile = path.join(lectureDirectory, 'README.slides.adoc');
    const transcriptFile = path.join(lectureDirectory, 'README.transcript.json');
    const convoOutputFile = path.join(lectureDirectory, 'README.convo.json');

    console.log(`Creating convo for: ${lectureDirectory}`);

    const readmeExists = await fileExists(readmeFile);
    const slidesExist = await fileExists(slidesFile);
    const transcriptExists = await fileExists(transcriptFile);

    if (!readmeExists) {
        console.warn(`README.md file was not found: ${readmeFile}`);
        return false;
    }

    if (!slidesExist) {
        console.warn(`README.slides.adoc file was not found: ${slidesFile}`);
        return false;
    }

    if (!transcriptExists) {
        console.warn(`README.transcript file was not found: ${transcriptFile}`);
        return false;
    }

    const readmeContent = await fs.readFile(readmeFile, 'utf8');
    const slidesContent = await fs.readFile(slidesFile, 'utf8');
    const transcriptContent = await fs.readFile(transcriptFile, 'utf8');

    if (!readmeContent.trim()) {
        console.warn(`Skipping convo because README.md is empty: ${readmeFile}`);
        return false;
    }

    if (!slidesContent.trim()) {
        console.warn(`Skipping convo because README.slides.adoc is empty: ${slidesFile}`);
        return false;
    }

    if (!transcriptContent.trim()) {
        console.warn(`Skipping convo because README.transcript.json is empty: ${transcriptFile}`);
        return false;
    }

    const slideCount = countSlides(slidesContent);

    if (await fileExists(convoOutputFile)) {
        const existingConvo = await readExistingJsonArray(convoOutputFile);
        const existingValidationReason = getConversationValidationReason(existingConvo, slideCount);
        if (!existingValidationReason) {
            console.log(`Skipping convo generation because valid output already exists: ${convoOutputFile}`);
            return true;
        }
        console.warn(`Regenerating convo because existing output is invalid: ${convoOutputFile}`);
        console.warn(existingValidationReason);
    }

    const messages = [
        {
            role: 'system',
            content: convoSystemPrompt
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
                '# Lecture README.transcript',
                '',
                '```text',
                transcriptContent,
                '```',
                'return only the JSON.',
            ].join('\n')
        }
    ];

    let convoData = await AIHelper.askForCode(messages);

    if (!convoData) {
        console.warn(`Skipping write because generated convo was empty: ${lectureDirectory}`);
        return false;
    }

    let validationReason = getConversationValidationReason(convoData, slideCount);
    for (let repairAttempt = 1; validationReason && repairAttempt <= MAX_JSON_SCHEMA_REPAIR_ATTEMPTS; repairAttempt++) {
        console.warn(`Repairing convo JSON for ${convoOutputFile} because: ${validationReason}`);
        convoData = await repairStructuredJson({
            kind: 'conversation',
            validationReason,
            slideOutline: getSlideOutline(slidesContent),
            currentJson: convoData,
            sourceBlocks: [
                ['Lecture README.md', readmeContent],
                ['Slide Deck README.slides.adoc', slidesContent],
                ['Lecture README.transcript.json', transcriptContent]
            ],
            schemaRules: [
                'Return a JSON array only.',
                'The array length must match the slide outline exactly.',
                'Each entry must have slide:number, topic:string, and dialogue:array.',
                'Each dialogue item must have role:"teacher" or "student" and text:string.',
                'Slide numbers and topics must match the slide outline exactly.'
            ]
        });
        validationReason = getConversationValidationReason(convoData, slideCount);
    }

    const finalConversationValidationReason = getConversationValidationReason(convoData, slideCount);
    if (finalConversationValidationReason) {
        console.warn(`Writing best available convo after ${MAX_JSON_SCHEMA_REPAIR_ATTEMPTS} repair attempt(s), even though validation still fails: ${convoOutputFile}`);
        console.warn(finalConversationValidationReason);
    }

    await fs.writeFile(
        convoOutputFile,
        JSON.stringify(convoData, null, 2),
        'utf8'
    );

    console.log(`Updated: ${convoOutputFile}`);
    return true;
}

async function repairStructuredJson({ kind, validationReason, slideOutline, currentJson, sourceBlocks, schemaRules }) {
    const messages = [
        {
            role: 'system',
            content: [
                `You repair ${kind} JSON for a lecture slide deck.`,
                'Return only valid JSON.',
                'Do not include Markdown fences, prose, comments, or trailing commas.',
                '',
                '# Schema rules',
                ...schemaRules
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                '# Validation failure',
                validationReason,
                '',
                '# Required slide outline',
                JSON.stringify(slideOutline, null, 2),
                '',
                '# Current JSON to repair',
                JSON.stringify(currentJson, null, 2),
                '',
                ...sourceBlocks.flatMap(([label, content]) => [
                    `# ${label}`,
                    '',
                    '```text',
                    content,
                    '```',
                    ''
                ]),
                'Return the repaired JSON array now.'
            ].join('\n')
        }
    ];

    return AIHelper.askForCode(messages);
}

main().catch((error) => {
    console.error('Failed to generate slides.');
    console.error(error);
    process.exit(1);
});

async function fileExists(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}

async function readExistingJsonArray(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        return {
            parseError: error.message
        };
    }
}

async function shouldBuildRenderedSlides(lectureDirectory) {
    const slidesFile = path.join(lectureDirectory, 'README.slides.adoc');
    const mdFile = path.join(lectureDirectory, 'README.md');

    const slidesExists = await fileExists(slidesFile);
    if (!slidesExists) {
        return false;
    }

    const htmlExists = await fileExists(mdFile);
    if (!htmlExists) {
        return true;
    }

    const [slidesStats, htmlStats] = await Promise.all([
        fs.stat(slidesFile),
        fs.stat(mdFile)
    ]);

    return htmlStats.mtimeMs > slidesStats.mtimeMs;
}

function countSlides(slidesContent) {
    return slidesContent
        .split(/\r?\n/)
        .filter((line) => /^= [^=]|^== [^=]/.test(line))
        .length;
}

function getSlideOutline(slidesContent) {
    return slidesContent
        .split(/\r?\n/)
        .filter((line) => /^= [^=]|^== [^=]/.test(line))
        .map((line, index) => ({
            slide: index + 1,
            topic: line.replace(/^=+\s+/, '').trim()
        }));
}

function validateSlides(slidesContent) {
    const slideCount = countSlides(slidesContent);
    if (slideCount === 0) {
        return {
            valid: false,
            reason: 'Generated slides have no AsciiDoc title or slide headings.'
        };
    }

    const titleCount = slidesContent
        .split(/\r?\n/)
        .filter((line) => /^= [^=]/.test(line))
        .length;

    if (titleCount !== 1) {
        return {
            valid: false,
            reason: `Generated slides must have exactly one document title; found ${titleCount}.`
        };
    }

    const lines = slidesContent.split(/\r?\n/);
    let inDelimitedBlock = false;
    let inTableBlock = false;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const trimmed = line.trim();

        if (/^(----|\.\.\.\.)$/.test(trimmed)) {
            inDelimitedBlock = !inDelimitedBlock;
            continue;
        }

        if (inDelimitedBlock) {
            continue;
        }

        if (isMarkdownTableSeparator(trimmed)) {
            return {
                valid: false,
                reason: `Line ${index + 1}: use AsciiDoc table blocks, not Markdown table separator rows.`
            };
        }

        if (trimmed === '|===') {
            if (!inTableBlock) {
                const previous = lines[index - 1]?.trim() || '';
                if (!/^\[cols="[^"]+", options="header"\]$/.test(previous)) {
                    return {
                        valid: false,
                        reason: `Line ${index + 1}: table blocks must be preceded by [cols="...", options="header"].`
                    };
                }
            }
            inTableBlock = !inTableBlock;
            continue;
        }

        if (/^===+ /.test(line)) {
            return {
                valid: false,
                reason: `Line ${index + 1}: use only == slide headings, not deeper headings.`
            };
        }

        if (/^\s+\*\*/.test(line)) {
            return {
                valid: false,
                reason: `Line ${index + 1}: nested AsciiDoc bullets must start at column 1, for example ** item.`
            };
        }

        if (/^\s+-\s+/.test(line)) {
            return {
                valid: false,
                reason: `Line ${index + 1}: do not use indented Markdown-style bullets in AsciiDoc slides.`
            };
        }
    }

    if (inTableBlock) {
        return {
            valid: false,
            reason: 'AsciiDoc table block is not closed with |===.'
        };
    }

    return validateSlideContentBudgets(slidesContent);
}

function getDiagramDensity(slidesContent) {
    const contentSlides = splitSlides(slidesContent).filter((slide) => slide.headingLevel === 2);
    const slideCount = contentSlides.length;
    const diagramSlides = contentSlides.filter((slide) => analyzeSlideContent(slide.lines).hasPlantUml).length;
    const ratio = slideCount === 0 ? 0 : diagramSlides / slideCount;

    return {
        slideCount,
        diagramSlides,
        ratio,
        targetRatio: TARGET_DIAGRAM_RATIO,
        minimumRatio: MIN_REGENERATE_DIAGRAM_RATIO,
        meetsTarget: slideCount > 0 && ratio >= TARGET_DIAGRAM_RATIO,
        meetsMinimum: slideCount > 0 && ratio >= MIN_REGENERATE_DIAGRAM_RATIO
    };
}

function getDiagramDensityMessage(density) {
    const percent = Math.round(density.ratio * 100);
    const targetPercent = Math.round(density.targetRatio * 100);
    const minimumPercent = Math.round(density.minimumRatio * 100);
    return `Diagram density: ${density.diagramSlides}/${density.slideCount} content slides (${percent}%). Target is about ${targetPercent}%; decks below ${minimumPercent}% are regenerated. This is not a validation failure.`;
}

function isMarkdownTableSeparator(line) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
}

function validateSlideContentBudgets(slidesContent) {
    const slides = splitSlides(slidesContent);

    for (const slide of slides) {
        const analysis = analyzeSlideContent(slide.lines);
        const label = slide.title || `slide starting at line ${slide.startLine}`;

        if (!analysis.hasColumns && analysis.topLevelBullets > 6) {
            return {
                valid: false,
                reason: `${label}: use no more than 6 top-level bullets; found ${analysis.topLevelBullets}.`
            };
        }

        if (!analysis.hasColumns && analysis.totalBullets > 8) {
            return {
                valid: false,
                reason: `${label}: use no more than 6 bullet lines total; found ${analysis.totalBullets}.`
            };
        }

        if (analysis.hasPlantUml && analysis.totalBullets > 0) {
            return {
                valid: false,
                reason: `${label}: do not combine PlantUML and bullets on the same slide.`
            };
        }

        if (analysis.hasPlantUml && (analysis.hasTable || analysis.hasSource || analysis.hasColumns)) {
            return {
                valid: false,
                reason: `${label}: PlantUML slides must not also contain tables, source blocks, or columns.`
            };
        }

        if (analysis.hasTable && analysis.totalBullets > 0) {
            return {
                valid: false,
                reason: `${label}: table slides must not also contain bullets.`
            };
        }

        if (analysis.hasSource && analysis.totalBullets > 0) {
            return {
                valid: false,
                reason: `${label}: code slides must not also contain bullets.`
            };
        }

        if (analysis.hasColumns && analysis.columnCount !== 2) {
            return {
                valid: false,
                reason: `${label}: column slides must use exactly 2 columns; found ${analysis.columnCount}.`
            };
        }

        if (analysis.hasColumns && (analysis.hasPlantUml || analysis.hasSource)) {
            return {
                valid: false,
                reason: `${label}: columns must not contain PlantUML or source blocks.`
            };
        }

        if (analysis.hasColumns && analysis.totalBullets > 6) {
            return {
                valid: false,
                reason: `${label}: column slides may contain at most 6 bullet lines total; found ${analysis.totalBullets}.`
            };
        }

        if (analysis.hasColumns && analysis.hasNestedBullets) {
            return {
                valid: false,
                reason: `${label}: column slides must not use nested bullets; split into separate slides.`
            };
        }
    }

    return { valid: true };
}

function splitSlides(slidesContent) {
    const lines = slidesContent.split(/\r?\n/);
    const slides = [];
    let current = null;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];

        if (/^= [^=]|^== [^=]/.test(line)) {
            if (current) {
                slides.push(current);
            }
            const headingLevel = line.startsWith('== ') ? 2 : 1;
            current = {
                title: line.replace(/^=+\s+/, '').trim(),
                headingLevel,
                startLine: index + 1,
                lines: []
            };
            continue;
        }

        if (current) {
            current.lines.push(line);
        }
    }

    if (current) {
        slides.push(current);
    }

    return slides;
}

function analyzeSlideContent(lines) {
    const analysis = {
        topLevelBullets: 0,
        totalBullets: 0,
        hasPlantUml: false,
        hasTable: false,
        hasSource: false,
        hasColumns: false,
        columnCount: 0,
        hasNestedBullets: false
    };

    let inDelimitedBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (/^\[plantuml\b/.test(trimmed)) {
            analysis.hasPlantUml = true;
        }

        if (/^\[source\b/.test(trimmed)) {
            analysis.hasSource = true;
        }

        if (/^\[\.columns\]$/.test(trimmed)) {
            analysis.hasColumns = true;
        }

        if (/^\[\.column\]$/.test(trimmed)) {
            analysis.columnCount++;
        }

        if (trimmed === '|===' || /^\[cols\b/.test(trimmed)) {
            analysis.hasTable = true;
        }

        if (/^(----|\.\.\.\.)$/.test(trimmed)) {
            inDelimitedBlock = !inDelimitedBlock;
            continue;
        }

        if (inDelimitedBlock) {
            continue;
        }

        if (/^\*\s+/.test(line)) {
            analysis.topLevelBullets++;
            analysis.totalBullets++;
        } else if (/^\*{2,3}\s+/.test(line)) {
            analysis.totalBullets++;
            analysis.hasNestedBullets = true;
        }
    }

    return analysis;
}

function validateTranscript(transcriptArray, slideCount, outputFile) {
    const validationReason = getTranscriptValidationReason(transcriptArray, slideCount);
    if (validationReason) {
        console.warn(`Skipping write because transcript is invalid: ${outputFile}`);
        console.warn(validationReason);
        return false;
    }

    return true;
}

function validateConversation(convoData, slideCount, outputFile) {
    const validationReason = getConversationValidationReason(convoData, slideCount);
    if (validationReason) {
        console.warn(`Skipping write because convo is invalid: ${outputFile}`);
        console.warn(validationReason);
        return false;
    }

    return true;
}

function getTranscriptValidationReason(transcriptArray, slideCount) {
    if (!Array.isArray(transcriptArray)) {
        return 'Transcript must be a JSON array.';
    }

    if (transcriptArray.length !== slideCount) {
        return `Transcript count ${transcriptArray.length} does not match slide count ${slideCount}.`;
    }

    for (let index = 0; index < transcriptArray.length; index++) {
        const entry = transcriptArray[index];
        if (!entry || typeof entry !== 'object') {
            return `Transcript entry ${index + 1} must be an object.`;
        }
        if (typeof entry.slide !== 'number') {
            return `Transcript entry ${index + 1} must contain slide:number.`;
        }
        if (entry.slide !== index + 1) {
            return `Transcript entry ${index + 1} has slide ${entry.slide}; expected ${index + 1}.`;
        }
        if (typeof entry.topic !== 'string' || !entry.topic.trim()) {
            return `Transcript entry ${index + 1} must contain topic:string.`;
        }
        if (typeof entry.text !== 'string' || !entry.text.trim()) {
            return `Transcript entry ${index + 1} must contain text:string.`;
        }
    }

    return null;
}

function getConversationValidationReason(convoData, slideCount) {
    if (!Array.isArray(convoData)) {
        return 'Conversation must be a JSON array.';
    }

    if (convoData.length !== slideCount) {
        return `Conversation count ${convoData.length} does not match slide count ${slideCount}.`;
    }

    for (let index = 0; index < convoData.length; index++) {
        const entry = convoData[index];
        if (!entry || typeof entry !== 'object') {
            return `Conversation entry ${index + 1} must be an object.`;
        }
        if (typeof entry.slide !== 'number') {
            return `Conversation entry ${index + 1} must contain slide:number.`;
        }
        if (entry.slide !== index + 1) {
            return `Conversation entry ${index + 1} has slide ${entry.slide}; expected ${index + 1}.`;
        }
        if (typeof entry.topic !== 'string' || !entry.topic.trim()) {
            return `Conversation entry ${index + 1} must contain topic:string.`;
        }
        if (!Array.isArray(entry.dialogue) || entry.dialogue.length === 0) {
            return `Conversation entry ${index + 1} must contain a non-empty dialogue array.`;
        }

        for (let lineIndex = 0; lineIndex < entry.dialogue.length; lineIndex++) {
            const line = entry.dialogue[lineIndex];
            if (!line || typeof line !== 'object') {
                return `Conversation entry ${index + 1}, dialogue ${lineIndex + 1} must be an object.`;
            }
            if (!['teacher', 'student'].includes(line.role)) {
                return `Conversation entry ${index + 1}, dialogue ${lineIndex + 1} must use role teacher or student.`;
            }
            if (typeof line.text !== 'string' || !line.text.trim()) {
                return `Conversation entry ${index + 1}, dialogue ${lineIndex + 1} must contain text:string.`;
            }
        }
    }

    return null;
}
