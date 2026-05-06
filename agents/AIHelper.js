const OpenAI = require('openai');

const apiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_KEY or OPENAI_API_KEY before running the lecture agents.');
}

global.openai = new OpenAI({
    apiKey
});

module.exports = {
    ask: async (messages) => {
        return _ask(messages);
    },
    askForCode: async (messages) => {
        return _askForCode(messages);
    },
    askForImage: async (prompt, options = {}) => {
        return _askForImage(prompt, options);
    },
}

async function _askForCode(messages) {
    let response = await _ask(messages);
    let tries = 0;

    while (tries < 3) {
        try {
            tries++;
            return parseJsonResponse(response);
        } catch (e) {
            console.warn("Fixing the response:", e);
            let nMessages = [
                {
                    role: 'system',
                    content: [
                        'The provided response could not be parsed as JSON.',
                        `Parser error: ${e.message}`,
                        'Return only valid JSON.',
                        'Do not include Markdown fences, prose, comments, or trailing commas.',
                        'The result must be a JSON array of objects.'
                    ].join('\n')
                },
                {
                    role: 'user',
                    content: `${response}`
                }];
            response = await _ask(nMessages);
        }
    }

    console.warn('Unable to parse model response as JSON after 3 attempts; returning raw response wrapped in JSON.');
    return [{
        slide: 1,
        topic: 'Unparsed Model Response',
        text: response,
        dialogue: [
            {
                role: 'teacher',
                text: response
            }
        ]
    }];
}

function parseJsonResponse(response) {
    if (typeof response !== 'string') {
        throw new Error('Expected a string response.');
    }

    const trimmed = stripMarkdownFence(response.trim());
    const jsonText = extractJsonText(trimmed);
    const parsed = JSON.parse(jsonText);

    if (typeof parsed === 'string') {
        return parseJsonResponse(parsed);
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Expected top-level JSON array.');
    }

    return parsed;
}

function stripMarkdownFence(text) {
    const fence = text.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```\s*$/);
    return fence ? fence[1].trim() : text;
}

function extractJsonText(text) {
    const firstArray = text.indexOf('[');

    if (firstArray !== -1) {
        return extractBalancedJsonArray(text, firstArray);
    }

    return text;
}

function extractBalancedJsonArray(text, startIndex) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < text.length; index++) {
        const char = text[index];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '[') {
            depth++;
        } else if (char === ']') {
            depth--;
            if (depth === 0) {
                return text.slice(startIndex, index + 1);
            }
        }
    }

    throw new Error('Could not find a complete JSON array in the response.');
}

async function _ask(messages) {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const completion = await global.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages
            });
            return completion.choices[0].message.content;
        } catch (error) {
            if (attempt >= maxAttempts || !isRetryableOpenAIError(error)) {
                throw error;
            }

            const delayMs = 1000 * Math.pow(2, attempt - 1);
            console.warn(`OpenAI request failed with ${error.status || error.code || error.name}; retrying in ${delayMs}ms.`);
            await delay(delayMs);
        }
    }
}

function isRetryableOpenAIError(error) {
    const status = error?.status;
    const code = error?.code;

    return status === 408
        || status === 409
        || status === 429
        || (typeof status === 'number' && status >= 500)
        || ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(code);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _askForImage(prompt, options = {}) {
    if (!global.openai || !global.openai.images || typeof global.openai.images.generate !== 'function') {
        throw new Error('OpenAI images API is not configured on global.openai');
    }
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('askForImage requires a non-empty prompt string');
    }

    const model = options.model || 'gpt-image-1';
    const size = options.size || '1024x1024';
    const outputFormat = options.output_format || options.outputFormat;
    const payload = {
        model,
        prompt,
        size
    };
    if (outputFormat) {
        payload.output_format = outputFormat;
    }

    let result;
    try {
        result = await global.openai.images.generate(payload);
    } catch (err) {
        // Backward/forward compatibility: retry without output_format if unsupported.
        if (outputFormat && (err?.code === 'unknown_parameter' || String(err?.message || '').includes('Unknown parameter'))) {
            result = await global.openai.images.generate({
                model,
                prompt,
                size
            });
        } else {
            throw err;
        }
    }

    if (result?.data?.[0]?.b64_json) {
        return result.data[0].b64_json;
    }
    if (result?.data?.[0]?.url) {
        return result.data[0].url;
    }

    return result;
}

function _limitMessages(messages) {
    let totalLength = 0;
    let numOfMessages = 0;
    for(let i in messages) {
        totalLength += messages[i].content.length;
        if(messages[i].role === 'system') {
            numOfSystems++;
        }
    }
    if(totalLength > 100000) {
        // Find the longest system prompt and cut the end off?
        let cutNumber = Math.floor((totalLength - 100000)/numOfSystems);
        for(let i in messages) {
            if(messages[i].role === 'system') {
               messages[i].content = messages[i].content.substring(0, messages[i].content.length - cutNumber);
            }
        }
    }
    return messages;
}
