#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const readline = require("node:readline/promises");
const { spawn } = require("node:child_process");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
];

const DEFAULT_WEEK_DIR = path.resolve(__dirname, "../doc/lectures/week2");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node uploadVideo.js [options]

Options:
  --week-dir <path>        Lecture week directory. Default: ../doc/lectures/week1
  --upload-json <path>     One lecture .output/upload.json file. Default: all lecture upload.json files in <week-dir>
  --api-key <key>          YouTube API key. Also reads YOUTUBE_API_KEY.
  --credentials <path>     OAuth credentials JSON. Supports the channel.creds shape used by youtubePublish.js.
  --privacy <status>       public, private, or unlisted. Default: public
  --dry-run                Print planned actions without uploading or editing files.
  --auth-url               Print a Google OAuth consent URL with the required YouTube upload scopes.
  --code <code>            Exchange a Google OAuth code for tokens and print credentials JSON.
  --no-interactive         Do not prompt for OAuth recovery during upload.
  --no-browser             Do not try to open the OAuth consent URL in a browser.

OAuth environment variables:
  YOUTUBE_CLIENT_ID
  YOUTUBE_CLIENT_SECRET
  YOUTUBE_REDIRECT_URI
  YOUTUBE_REFRESH_TOKEN
  YOUTUBE_ACCESS_TOKEN      Optional
  YOUTUBE_TOKEN_EXPIRY      Optional milliseconds since epoch

Each lecture .output/upload.json stores both upload metadata and upload state.
Note: API keys can identify a project, but YouTube video uploads require OAuth credentials.`);
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractVideoUrl(readmePath) {
  if (!fs.existsSync(readmePath)) {
    return null;
  }
  const content = fs.readFileSync(readmePath, "utf8");
  const match = content.match(/^#{1,6}\s+Video:\s*(\S+)\s*$/m);
  return match ? match[1] : null;
}

function videoIdFromUrl(videoUrl) {
  if (!videoUrl) {
    return null;
  }
  try {
    const parsed = new URL(videoUrl);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
  } catch (error) {
    return videoUrl.split("/").pop();
  }
  return videoUrl.split("/").pop();
}

function upsertVideoUrl(readmePath, videoUrl) {
  const original = fs.readFileSync(readmePath, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const normalized = original.replace(/\r\n/g, "\n");

  if (/^#{1,6}\s+Video:\s*\S+\s*$/m.test(normalized)) {
    return normalized
      .replace(/^#{1,6}\s+Video:\s*\S+\s*$/m, `## Video: ${videoUrl}`)
      .replace(/\n/g, eol);
  }

  const lines = normalized.split("\n");
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  if (titleIndex === -1) {
    lines.splice(2 , 0, "", `## Video: ${videoUrl}`);
  } else {
    lines.splice(titleIndex + 1, 0, "", `## Video: ${videoUrl}`);
  }
  return lines.join("\n").replace(/\n/g, eol);
}

function findLectureUploadFiles(weekDir, explicitUploadJson) {
  if (explicitUploadJson) {
    return [path.resolve(explicitUploadJson)];
  }

  return fs
    .readdirSync(weekDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ".output")
    .map((entry) => path.resolve(weekDir, entry.name, ".output/upload.json"))
    .sort();
}

function buildLectureRecord(repoRoot, uploadJsonPath) {
  const outputDir = path.dirname(uploadJsonPath);
  const lectureDir = path.dirname(outputDir);
  const metaPath = path.resolve(lectureDir, "meta.json");

  const config = fs.existsSync(uploadJsonPath)
    ? readJson(uploadJsonPath)
    : (fs.existsSync(metaPath) ? readJson(metaPath) : null);

  if (!config) {
    throw new Error(`Missing upload metadata. Expected ${uploadJsonPath} or ${metaPath}`);
  }

  if (!config?.slug) {
    throw new Error(`Lecture upload file is missing slug: ${uploadJsonPath}`);
  }

  const readmePath = config.source ? path.resolve(repoRoot, config.source) : path.resolve(lectureDir, "README.md");
  const videoPath = config.videoPath ? path.resolve(repoRoot, config.videoPath) : path.resolve(outputDir, "output.mp4");
  return {
    ...config,
    config,
    uploadJsonPath,
    readmePath,
    lectureDir,
    videoPath,
  };
}

function writeLectureUpload(lecture, upload) {
  lecture.upload = upload;
  lecture.config.upload = upload;
  writeJson(lecture.uploadJsonPath, lecture.config);
}

function buildLectureUploadRecord(lecture, repoRoot) {
  return {
    course: lecture.course,
    week: lecture.week,
    generated_for: lecture.generated_for,
    slug: lecture.slug,
    source: path.relative(repoRoot, lecture.readmePath).replace(/\\/g, "/"),
    videoPath: path.relative(repoRoot, lecture.videoPath).replace(/\\/g, "/"),
    youtube_title: lecture.youtube_title,
    summary: lecture.summary,
    youtube_description: lecture.youtube_description,
    tags: Array.isArray(lecture.tags) ? lecture.tags : [],
    ...(lecture.upload ? { upload: lecture.upload } : {}),
  };
}

function writeLectureUploadMetadata(lecture, repoRoot) {
  writeJson(lecture.uploadJsonPath, buildLectureUploadRecord(lecture, repoRoot));
}

function lectureMetaPath(lectureDir) {
  return path.resolve(lectureDir, "meta.json");
}

function buildLectureMetaRecord(lecture, repoRoot) {
  return {
    course: lecture.course,
    week: lecture.week,
    generated_for: lecture.generated_for,
    slug: lecture.slug,
    source: path.relative(repoRoot, lecture.readmePath).replace(/\\/g, "/"),
    videoPath: path.relative(repoRoot, lecture.videoPath).replace(/\\/g, "/"),
    youtube_title: lecture.youtube_title,
    summary: lecture.summary,
    youtube_description: lecture.youtube_description,
    tags: Array.isArray(lecture.tags) ? lecture.tags : [],
  };
}

function writeLectureMeta(lecture, repoRoot) {
  const metaPath = lectureMetaPath(lecture.lectureDir);
  writeJson(metaPath, buildLectureMetaRecord(lecture, repoRoot));
}

function loadCredentials(args) {
  const { oauth2Client } = loadOAuthClient(args);
  return oauth2Client;
}

function loadOAuthClient(args) {
  const credentialsPath = args.credentials || process.env.YOUTUBE_CREDENTIALS;
  let creds = null;

  if (credentialsPath) {
    const raw = readJson(path.resolve(credentialsPath));
    creds = raw.creds || raw.installed || raw.web || raw;
  }

  const clientId = args["client-id"] || process.env.YOUTUBE_CLIENT_ID || creds?.client_id;
  const clientSecret = args["client-secret"] || process.env.YOUTUBE_CLIENT_SECRET || creds?.client_secret;
  const redirectUri =
    args["redirect-uri"] ||
    process.env.YOUTUBE_REDIRECT_URI ||
    creds?.redirect_uri ||
    creds?.redirect_uris?.[0] ||
    "http://localhost";
  const tokens = {
    ...(creds?.tokens || {}),
  };

  if (args["refresh-token"] || process.env.YOUTUBE_REFRESH_TOKEN) {
    tokens.refresh_token = args["refresh-token"] || process.env.YOUTUBE_REFRESH_TOKEN;
  }
  if (args["access-token"] || process.env.YOUTUBE_ACCESS_TOKEN) {
    tokens.access_token = args["access-token"] || process.env.YOUTUBE_ACCESS_TOKEN;
  }
  if (args["token-expiry"] || process.env.YOUTUBE_TOKEN_EXPIRY) {
    tokens.expiry_date = Number(args["token-expiry"] || process.env.YOUTUBE_TOKEN_EXPIRY);
  }

  if (!clientId || !clientSecret || !tokens.refresh_token) {
    throw new Error(
      "Missing OAuth credentials. Provide --credentials or YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN. If your token has insufficient scopes, run interactively or use --auth-url and exchange the returned code with --code."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.credentials = tokens;
  return { oauth2Client, clientId, clientSecret, redirectUri, creds };
}

function loadOAuthClientForAuthFlow(args) {
  const credentialsPath = args.credentials || process.env.YOUTUBE_CREDENTIALS;
  let creds = null;

  if (credentialsPath) {
    const raw = readJson(path.resolve(credentialsPath));
    creds = raw.creds || raw.installed || raw.web || raw;
  }

  const clientId = args["client-id"] || process.env.YOUTUBE_CLIENT_ID || creds?.client_id;
  const clientSecret = args["client-secret"] || process.env.YOUTUBE_CLIENT_SECRET || creds?.client_secret;
  const redirectUri =
    args["redirect-uri"] ||
    process.env.YOUTUBE_REDIRECT_URI ||
    creds?.redirect_uri ||
    creds?.redirect_uris?.[0] ||
    "http://localhost";

  if (!clientId || !clientSecret) {
    throw new Error("Missing OAuth client. Provide --credentials or YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.");
  }

  return {
    oauth2Client: new google.auth.OAuth2(clientId, clientSecret, redirectUri),
    clientId,
    clientSecret,
    redirectUri,
  };
}

function printAuthUrl(args) {
  const { oauth2Client } = loadOAuthClientForAuthFlow(args);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log(url);
}

function canPrompt(args) {
  return !args["no-interactive"] && process.stdin.isTTY && process.stdout.isTTY;
}

function credentialSavePath(args) {
  return path.resolve(args.credentials || process.env.YOUTUBE_CREDENTIALS || "youtube.creds.json");
}

function credentialPayload(clientId, clientSecret, redirectUri, tokens) {
  return {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    tokens,
  };
}

function openUrl(url) {
  const command =
    process.platform === "win32" ? "cmd" :
    process.platform === "darwin" ? "open" :
    "xdg-open";
  const args =
    process.platform === "win32" ? ["/c", "start", "", url] :
    [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    shell: false,
  });
  child.unref();
}

async function promptForScopedCredentials(args) {
  const { oauth2Client, clientId, clientSecret, redirectUri } = loadOAuthClientForAuthFlow(args);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("");
  console.log("YouTube needs a fresh OAuth approval with upload scope.");
  console.log("Open this URL, approve access, then paste the returned code here:");
  console.log("");
  console.log(url);
  console.log("");
  if (!args["no-browser"]) {
    try {
      openUrl(url);
      console.log("Opened the consent URL in your default browser.");
      console.log("");
    } catch (error) {
      console.log("Could not open the browser automatically. Use the URL above.");
      console.log("");
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = (await rl.question("Paste Google OAuth code: ")).trim();
  rl.close();

  if (!code) {
    throw new Error("No OAuth code entered.");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.credentials = tokens;

  const savePath = credentialSavePath(args);
  writeJson(savePath, credentialPayload(clientId, clientSecret, redirectUri, tokens));
  args.credentials = savePath;
  console.log(`Saved YouTube credentials to ${savePath}`);
  return oauth2Client;
}

async function loadCredentialsOrPrompt(args) {
  try {
    return loadCredentials(args);
  } catch (error) {
    if (canPrompt(args) && String(error?.message || "").startsWith("Missing OAuth credentials.")) {
      return promptForScopedCredentials(args);
    }
    throw error;
  }
}

function isInsufficientScopeError(error) {
  const message = String(error?.message || "");
  const reason = error?.errors?.[0]?.reason || error?.response?.data?.error;
  return message.includes("insufficient authentication scopes") || reason === "insufficientPermissions";
}

function printScopedAuthRecovery() {
  console.error("");
  console.error("The OAuth token in the credentials file does not include the scope required for YouTube uploads.");
  console.error("Regenerate credentials with:");
  console.error("  node uploadVideo.js --credentials youtube.creds.json --auth-url");
  console.error("Open the URL, approve access, then exchange the returned code:");
  console.error("  node uploadVideo.js --credentials youtube.creds.json --code \"PASTE_CODE_HERE\" > youtube.creds.new.json");
  console.error("Then rerun:");
  console.error("  npm run upload:videos -- --credentials youtube.creds.new.json");
  console.error("");
  console.error("Do not rerun with the old youtube.creds.json unless you replace it with the newly generated credentials.");
}

async function exchangeAuthCode(args) {
  const { oauth2Client, clientId, clientSecret, redirectUri } = loadOAuthClientForAuthFlow(args);
  const { tokens } = await oauth2Client.getToken(args.code);
  console.log(JSON.stringify(credentialPayload(clientId, clientSecret, redirectUri, tokens), null, 2));
}

async function uploadVideo(youtube, auth, lecture, privacyStatus) {
  if (!fs.existsSync(lecture.videoPath)) {
    throw new Error(`Missing video file: ${lecture.videoPath}`);
  }

  const response = await youtube.videos.insert({
    auth,
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: lecture.youtube_title.slice(0, 100),
        description: lecture.youtube_description || lecture.summary || "",
        tags: lecture.tags || [],
        categoryId: "27",
        defaultLanguage: "en",
        defaultAudioLanguage: "en",
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(lecture.videoPath),
    },
  });

  const videoId = response.data.id;
  const outputDir = path.dirname(lecture.videoPath);
  const thumbnailCandidates = ["thumbnail.png", "tile.png"];
  const thumbnailPath = thumbnailCandidates
    .map((name) => path.resolve(outputDir, name))
    .find((candidate) => fs.existsSync(candidate));

  if (thumbnailPath) {
    await youtube.thumbnails.set({
      auth,
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
  }

  return {
    videoId,
    url: `https://youtu.be/${videoId}`,
  };
}

async function runYoutubeWork({ lectures, repoRoot, privacyStatus, apiKey, auth }) {
  const pendingLectures = lectures.filter((lecture) => !lecture.upload?.url);
  if (pendingLectures.length === 0) {
    console.log("No pending uploads.");
    return;
  }

  const youtube = google.youtube({
    version: "v3",
    auth,
    params: apiKey ? { key: apiKey } : undefined,
  });
  for (const lecture of pendingLectures) {
    console.log(`Uploading ${lecture.slug}: ${lecture.videoPath}`);
    const uploaded = await uploadVideo(youtube, auth, lecture, privacyStatus);
    writeLectureUpload(lecture, {
      url: uploaded.url,
      videoId: uploaded.videoId,
      source: lecture.source,
      videoPath: path.relative(repoRoot, lecture.videoPath).replace(/\\/g, "/"),
      uploadedAt: new Date().toISOString(),
    });

    const readmeContent = upsertVideoUrl(lecture.readmePath, uploaded.url);
    fs.writeFileSync(lecture.readmePath, readmeContent, "utf8");
    console.log(`Uploaded ${lecture.slug}: ${uploaded.url}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }
  if (args["auth-url"]) {
    printAuthUrl(args);
    return;
  }
  if (args.code) {
    await exchangeAuthCode(args);
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");
  const weekDir = path.resolve(args["week-dir"] || DEFAULT_WEEK_DIR);
  const privacyStatus = args.privacy || process.env.YOUTUBE_PRIVACY || "public";
  const apiKey = args["api-key"] || process.env.YOUTUBE_API_KEY;
  const dryRun = Boolean(args["dry-run"]);

  if (!["public", "private", "unlisted"].includes(privacyStatus)) {
    throw new Error(`Invalid privacy status: ${privacyStatus}`);
  }

  const uploadJsonFiles = findLectureUploadFiles(weekDir, args["upload-json"]);
  if (uploadJsonFiles.length === 0) {
    throw new Error(`No lecture upload.json files found in ${weekDir}`);
  }

  const lectures = uploadJsonFiles.map((uploadJsonFile) => buildLectureRecord(repoRoot, uploadJsonFile));

  if (dryRun) {
    for (const lecture of lectures) {
      console.log(`PLAN META ${path.relative(repoRoot, lectureMetaPath(lecture.lectureDir)).replace(/\\/g, "/")}`);
      console.log(`PLAN UPLOAD ${path.relative(repoRoot, lecture.uploadJsonPath).replace(/\\/g, "/")}`);
    }
  } else {
    for (const lecture of lectures) {
      writeLectureMeta(lecture, repoRoot);
      writeLectureUploadMetadata(lecture, repoRoot);
    }
  }

  for (const lecture of lectures) {
    const existingUrl = extractVideoUrl(lecture.readmePath);
    if (existingUrl && !lecture.upload) {
      lecture.upload = {
        url: existingUrl,
        videoId: videoIdFromUrl(existingUrl),
        source: lecture.source,
        videoPath: path.relative(repoRoot, lecture.videoPath).replace(/\\/g, "/"),
        seededFromReadme: true,
        updatedAt: new Date().toISOString(),
      };
      if (!dryRun) {
        writeLectureUpload(lecture, lecture.upload);
      }
    }
    const readmeUrl = existingUrl || lecture.upload?.url;
    if (readmeUrl && !dryRun) {
      const updatedReadme = upsertVideoUrl(lecture.readmePath, readmeUrl);
      const currentReadme = fs.readFileSync(lecture.readmePath, "utf8");
      if (updatedReadme !== currentReadme) {
        fs.writeFileSync(lecture.readmePath, updatedReadme, "utf8");
      }
    }
  }

  if (dryRun) {
    console.log(`Dry run for ${lectures.length} lecture(s).`);
    for (const lecture of lectures) {
      const uploadEntry = lecture.upload;
      const action = uploadEntry?.url ? "SKIP" : "UPLOAD";
      console.log(`${action} ${lecture.slug}${uploadEntry?.url ? ` -> ${uploadEntry.url}` : ""}`);
    }
    return;
  }

  let auth = await loadCredentialsOrPrompt(args);
  try {
    await runYoutubeWork({ lectures, repoRoot, privacyStatus, apiKey, auth });
  } catch (error) {
    if (!isInsufficientScopeError(error) || !canPrompt(args)) {
      throw error;
    }
    console.error(error.message);
    auth = await promptForScopedCredentials(args);
    await runYoutubeWork({ lectures, repoRoot, privacyStatus, apiKey, auth });
  }
}

main().catch((error) => {
  console.error(error.message);
  if (isInsufficientScopeError(error)) {
    printScopedAuthRecovery();
  }
  process.exitCode = 1;
});
