#!/usr/bin/env node

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DOC_DIR = path.resolve(ROOT, "doc");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, ".output", "brightspace");
const DEFAULT_GITHUB_BASE_URL = "https://github.com/madajaju/CS5891/";
const COURSE_TITLE = "CS 5891b - Object-Oriented Systems Under Concurrency";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }
  const docDir = path.resolve(args["doc-dir"] || DEFAULT_DOC_DIR);
  const outputDir = path.resolve(args.output || DEFAULT_OUTPUT_DIR);
  const githubBaseUrl = normalizeBaseUrl(args["github-base-url"] || DEFAULT_GITHUB_BASE_URL);
  const packageDir = path.join(outputDir, "package");
  const zipPath = path.join(outputDir, "cs5891-brightspace-import.zip");

  await recreateDir(packageDir);

  const components = await collectComponents(docDir);
  const pages = buildPages(components, githubBaseUrl);

  for (const page of pages) {
    await writePage(packageDir, page);
  }

  await fs.writeFile(
    path.join(packageDir, "index.html"),
    renderCourseHome(pages),
    "utf8"
  );
  await fs.writeFile(
    path.join(packageDir, "imsmanifest.xml"),
    renderManifest(pages),
    "utf8"
  );

  if (!args["no-zip"]) {
    await createZip(packageDir, zipPath);
  }

  console.log(`Brightspace package directory: ${packageDir}`);
  if (!args["no-zip"]) {
    console.log(`Brightspace import ZIP: ${zipPath}`);
  }
}

function printHelp() {
  console.log(`Usage:
  node generateBrightspace.js [options]

Options:
  --doc-dir <path>   Source documentation directory. Default: ../doc
  --output <path>    Output directory. Default: ../.output/brightspace
  --github-base-url <url>
                     Base GitHub repository URL for lecture detail links.
                     Default: ${DEFAULT_GITHUB_BASE_URL}
  --no-zip           Generate the package folder without creating a ZIP.

Output:
  .output/brightspace/package/
  .output/brightspace/cs5891-brightspace-import.zip

The ZIP is an IMS Content Package with imsmanifest.xml at the root.`);
}

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

async function recreateDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function collectComponents(docDir) {
  const lecturesDir = path.join(docDir, "lectures");
  const assignmentsDir = path.join(docDir, "assignments");
  const projectsDir = path.join(docDir, "projects");

  return {
    lectures: await collectLectures(lecturesDir),
    assignments: await collectNamedIndexFiles(assignmentsDir),
    projects: await collectProjects(projectsDir),
  };
}

async function collectLectures(lecturesDir) {
  const weeks = [];
  for (const weekEntry of await sortedDirs(lecturesDir)) {
    if (!/^week\d+$/i.test(weekEntry.name)) {
      continue;
    }
    const lectures = [];
    for (const lectureEntry of await sortedDirs(weekEntry.path)) {
      const readme = path.join(lectureEntry.path, "README.md");
      if (!fsSync.existsSync(readme)) {
        continue;
      }
      lectures.push(await readComponent(readme, {
        kind: "lecture",
        module: weekEntry.name,
        slug: lectureEntry.name,
      }));
    }
    if (lectures.length > 0) {
      weeks.push({
        name: weekEntry.name,
        title: weekTitle(weekEntry.name),
        lectures,
      });
    }
  }
  return weeks;
}

async function collectNamedIndexFiles(parentDir) {
  const results = [];
  for (const entry of await sortedDirs(parentDir)) {
    const index = path.join(entry.path, "index.md");
    if (fsSync.existsSync(index)) {
      results.push(await readComponent(index, {
        kind: "assignment",
        module: "assignments",
        slug: entry.name,
      }));
    }
  }
  return results;
}

async function collectProjects(projectsDir) {
  const results = [];
  const overview = path.join(projectsDir, "README.md");
  if (fsSync.existsSync(overview)) {
    results.push(await readComponent(overview, {
      kind: "project",
      module: "projects",
      slug: "overview",
    }));
  }
  for (const entry of await sortedDirs(projectsDir)) {
    const index = path.join(entry.path, "index.md");
    if (fsSync.existsSync(index)) {
      results.push(await readComponent(index, {
        kind: "project",
        module: "projects",
        slug: entry.name,
      }));
    }
  }
  return results;
}

async function sortedDirs(dir) {
  if (!fsSync.existsSync(dir)) {
    return [];
  }
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(dir, entry.name),
    }))
    .sort((a, b) => naturalCompare(a.name, b.name));
}

async function readComponent(filePath, metadata) {
  const markdown = await fs.readFile(filePath, "utf8");
  return {
    ...metadata,
    source: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    title: extractTitle(markdown) || titleFromSlug(metadata.slug),
    markdown,
  };
}

function buildPages(components, githubBaseUrl) {
  const pages = [];

  for (const week of components.lectures) {
    for (const lecture of week.lectures) {
      pages.push({
        ...lecture,
        group: "Lectures",
        moduleTitle: week.title,
        href: `content/lectures/${week.name}/${lecture.slug}.html`,
        detailUrl: githubUrlForSource(githubBaseUrl, lecture.source),
      });
    }
  }

  for (const assignment of components.assignments) {
    pages.push({
      ...assignment,
      group: "Assignments",
      moduleTitle: "Assignments",
      href: `content/assignments/${assignment.slug}.html`,
    });
  }

  for (const project of components.projects) {
    pages.push({
      ...project,
      group: "Project Domains",
      moduleTitle: "Project Domains",
      href: `content/projects/${project.slug}.html`,
    });
  }

  return pages;
}

async function writePage(packageDir, page) {
  const outputPath = path.join(packageDir, page.href);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, renderHtmlPage(page), "utf8");
}

function renderCourseHome(pages) {
  const groups = groupBy(pages, (page) => page.group);
  const body = Object.entries(groups)
    .map(([group, groupPages]) => {
      const items = groupPages
        .map((page) => `<li><a href="${escapeAttr(page.href)}">${escapeHtml(page.title)}</a></li>`)
        .join("\n");
      return `<section>\n<h2>${escapeHtml(group)}</h2>\n<ul>\n${items}\n</ul>\n</section>`;
    })
    .join("\n");

  return renderHtmlDocument(COURSE_TITLE, `<h1>${escapeHtml(COURSE_TITLE)}</h1>\n${body}`);
}

function renderHtmlPage(page) {
  if (page.kind === "lecture") {
    return renderLectureSummaryPage(page);
  }
  const content = markdownToHtml(page.markdown);
  const source = `<p class="source-note">Source: ${escapeHtml(page.source)}</p>`;
  return renderHtmlDocument(page.title, `${source}\n${content}`);
}

function renderLectureSummaryPage(page) {
  const objectives = extractSectionBullets(page.markdown, "Learning Objectives");
  const summary = extractOpeningSummary(page.markdown) || fallbackLectureSummary(page.title);
  const assignment = extractMetadataValue(page.markdown, "Assignment Alignment");
  const objectiveItems = objectives
    .map((objective) => `<li>${inlineMarkdown(objective)}</li>`)
    .join("\n");
  const assignmentHtml = assignment
    ? `<p class="meta-line"><strong>Assignment alignment:</strong> ${inlineMarkdown(stripMarkdownLinks(assignment))}</p>`
    : "";

  const body = `<p class="source-note">Brightspace summary for ${escapeHtml(page.source)}</p>
<h1>${escapeHtml(page.title)}</h1>
${assignmentHtml}
<section>
<h2>Summary</h2>
<p>${inlineMarkdown(summary)}</p>
</section>
<section>
<h2>Learning Objectives</h2>
<ul>
${objectiveItems || "<li>Review the full lecture details and connect the concept to project evidence.</li>"}
</ul>
</section>
<section class="detail-link">
<h2>Full Lecture</h2>
<p><a href="${escapeAttr(page.detailUrl)}">Open the full lecture in GitHub</a></p>
</section>`;

  return renderHtmlDocument(page.title, body);
}

function renderHtmlDocument(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.55; max-width: 960px; margin: 2rem auto; padding: 0 1rem; color: #202124; }
    h1, h2, h3 { line-height: 1.2; }
    code, pre { font-family: Consolas, Monaco, monospace; }
    pre { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 1rem; overflow-x: auto; }
    blockquote { border-left: 4px solid #9aa0a6; margin-left: 0; padding-left: 1rem; color: #3c4043; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #d0d7de; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f1f3f4; }
    .source-note { color: #5f6368; font-size: 0.9rem; }
    .meta-line { color: #3c4043; }
    .detail-link { border: 1px solid #d0d7de; border-radius: 6px; padding: 1rem; background: #f8fafd; }
    .detail-link a { font-weight: 700; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}

function renderManifest(pages) {
  const resources = [
    `<resource identifier="res_index" type="webcontent" href="index.html"><file href="index.html"/></resource>`,
    ...pages.map((page) => {
      const id = resourceId(page);
      return `<resource identifier="${id}" type="webcontent" href="${escapeXml(page.href)}"><file href="${escapeXml(page.href)}"/></resource>`;
    }),
  ].join("\n    ");

  const organizations = renderOrganizationItems(pages);

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="cs5891_brightspace_import" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.4</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="en">${escapeXml(COURSE_TITLE)}</imsmd:langstring>
        </imsmd:title>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations default="org_cs5891">
    <organization identifier="org_cs5891" structure="hierarchical">
      <title>${escapeXml(COURSE_TITLE)}</title>
      <item identifier="item_index" identifierref="res_index">
        <title>Course Home</title>
      </item>
${organizations}
    </organization>
  </organizations>
  <resources>
    ${resources}
  </resources>
</manifest>
`;
}

function renderOrganizationItems(pages) {
  const groups = groupBy(pages, (page) => page.group);
  return Object.entries(groups)
    .map(([group, groupPages], groupIndex) => {
      const modules = groupBy(groupPages, (page) => page.moduleTitle);
      const moduleItems = Object.entries(modules)
        .map(([moduleTitle, modulePages], moduleIndex) => {
          const topicItems = modulePages
            .map((page, topicIndex) => {
              return `          <item identifier="item_${groupIndex}_${moduleIndex}_${topicIndex}" identifierref="${resourceId(page)}">
            <title>${escapeXml(page.title)}</title>
          </item>`;
            })
            .join("\n");
          return `      <item identifier="module_${groupIndex}_${moduleIndex}">
        <title>${escapeXml(moduleTitle)}</title>
${topicItems}
      </item>`;
        })
        .join("\n");
      return `      <item identifier="group_${groupIndex}">
        <title>${escapeXml(group)}</title>
${moduleItems}
      </item>`;
    })
    .join("\n");
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inCode = false;
  let code = [];
  let inList = false;
  let inTable = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      html.push("</tbody></table>");
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeList();
        closeTable();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!trimmed) {
      closeList();
      closeTable();
      continue;
    }

    if (/^\|.+\|$/.test(trimmed) && lines[i + 1] && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) {
      closeList();
      const headers = splitMarkdownTableRow(trimmed);
      html.push("<table><thead><tr>");
      html.push(headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join(""));
      html.push("</tr></thead><tbody>");
      inTable = true;
      i += 1;
      continue;
    }

    if (inTable && /^\|.+\|$/.test(trimmed)) {
      const cells = splitMarkdownTableRow(trimmed);
      html.push(`<tr>${cells.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`);
      continue;
    }

    closeTable();

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(numbered[1])}</li>`);
      continue;
    }

    if (trimmed === "---") {
      closeList();
      html.push("<hr>");
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  closeTable();
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }
  return html.join("\n");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = href.endsWith(".md") ? href.replace(/\.md(#.*)?$/, ".html$1") : href;
      return `<a href="${escapeAttr(safeHref)}">${label}</a>`;
    });
}

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

function extractMetadataValue(markdown, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^- ${escapedKey}:\\s+(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

function extractSectionBullets(markdown, heading) {
  const section = extractSection(markdown, heading);
  if (!section) {
    return [];
  }
  return section
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^[-*]\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function extractOpeningSummary(markdown) {
  const section = extractSection(markdown, "Opening Narrative");
  if (!section) {
    return null;
  }
  const paragraphs = section
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (paragraphs.length === 0) {
    return null;
  }
  return paragraphs[0];
}

function extractSection(markdown, heading) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const headingLine = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === headingLine);
  if (start === -1) {
    return null;
  }

  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      break;
    }
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

function fallbackLectureSummary(title) {
  return `${title} introduces a design pressure in concurrent object-oriented systems and connects it to invariants, failure evidence, correction mechanisms, and assignment work.`;
}

function githubUrlForSource(baseUrl, source) {
  return new URL(`blob/main/${source}`, baseUrl).toString();
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function splitMarkdownTableRow(row) {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function titleFromSlug(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function weekTitle(weekName) {
  const number = weekName.replace(/[^\d]/g, "");
  return `Week ${number}`;
}

function resourceId(page) {
  return `res_${sanitizeId(`${page.kind}_${page.moduleTitle}_${page.slug}`)}`;
}

function sanitizeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeAttr(value).replace(/'/g, "&apos;");
}

async function createZip(packageDir, zipPath) {
  await fs.mkdir(path.dirname(zipPath), { recursive: true });
  await fs.rm(zipPath, { force: true });

  const powershell = process.platform === "win32" ? "powershell" : "pwsh";
  const result = spawnSync(
    powershell,
    [
      "-NoProfile",
      "-Command",
      "$dest = [Environment]::GetEnvironmentVariable('BRIGHTSPACE_ZIP_PATH'); Compress-Archive -Path * -DestinationPath $dest -Force",
    ],
    {
      cwd: packageDir,
      encoding: "utf8",
      env: {
        ...process.env,
        BRIGHTSPACE_ZIP_PATH: zipPath,
      },
    }
  );

  if (result.status !== 0) {
    throw new Error(`Failed to create ZIP:\n${result.stderr || result.stdout}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
