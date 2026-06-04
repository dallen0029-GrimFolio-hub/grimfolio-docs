#!/usr/bin/env node
/* ============================================================
   GrimFolio Docs — generate-index.js
   Crawls all HTML files and outputs search-index.json.
   Run: node generate-index.js
   Run before every deploy.
   ============================================================ */

const fs = require('fs');
const path = require('path');

// Pages to index (relative paths from repo root)
const PAGES = [
  'index.html',
  'dashboard.html',
  'stage-1.html',
  'stage-2.html',
  'stage-3.html',
  'grim.html',
  'exports.html',
  'reference-documents.html',
  'inspiration-library.html',
  'grimvision.html',
  'inventory.html',
  'calendar.html',
  'account.html',
  'team.html',
  'referrals.html',
  'blog/index.html',
  'blog/planning-the-ritual-2026.html',
  'blog/why-spreadsheets-dont-work.html',
  'blog/grimfolio-for-dnd.html',
];

// Simple HTML entity decoder
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x[0-9a-fA-F]+;/g, ' ')
    .replace(/&#\d+;/g, ' ');
}

// Strip HTML tags from a string
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ');
}

// Collapse whitespace
function collapseWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

// Extract text content of the first match of a regex
function extractFirst(html, regex) {
  var m = html.match(regex);
  return m ? decodeEntities(stripTags(m[1])).trim() : '';
}

// Parse a single HTML file into index records (one per H2 section)
function parseFile(filePath, urlPath) {
  var html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.warn('  Skipping (not found):', filePath);
    return [];
  }

  var records = [];

  // Extract page title from <h1> or <title>
  var pageTitle =
    extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    extractFirst(html, /<title>([\s\S]*?)<\/title>/i) ||
    path.basename(filePath, '.html');

  // Extract main content body (between content-body div)
  var bodyMatch = html.match(/<(?:div|main)[^>]*class="[^"]*content-body[^"]*"[^>]*>([\s\S]*?)<\/(?:div|main)>/i);
  var bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // Split by H2 headings
  var sections = bodyHtml.split(/<h2[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/gi);

  // sections[0] = content before first H2 (intro)
  // Then repeating: id, heading text, content

  // Index intro (before first H2)
  var intro = collapseWhitespace(decodeEntities(stripTags(sections[0])));
  if (intro.length > 20) {
    records.push({
      title: pageTitle,
      section: '',
      body: intro.slice(0, 500),
      url: urlPath
    });
  }

  // Index each H2 section
  var i = 1;
  while (i < sections.length) {
    var sectionId = sections[i] || '';
    var sectionHeading = decodeEntities(stripTags(sections[i + 1] || ''));
    var sectionContent = collapseWhitespace(decodeEntities(stripTags(sections[i + 2] || '')));

    if (sectionHeading) {
      records.push({
        title: pageTitle,
        section: sectionHeading,
        body: sectionContent.slice(0, 600),
        url: urlPath + (sectionId ? '#' + sectionId : '')
      });
    }

    i += 3;
  }

  return records;
}

// Build index
var index = [];
var rootDir = __dirname;

PAGES.forEach(function (page) {
  var filePath = path.join(rootDir, page);
  var urlPath = '/' + page.replace(/\\/g, '/');
  console.log('Indexing:', page);
  var records = parseFile(filePath, urlPath);
  index = index.concat(records);
});

var outputPath = path.join(rootDir, 'search-index.json');
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf8');
console.log('\nDone. ' + index.length + ' records written to search-index.json');
