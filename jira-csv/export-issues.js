require('dotenv').config({ path: '../.env' });

const { Parser } = require('json2csv');
const axios = require('axios');

// --- ENV setup ---
const BASE  = process.env.JIRA_BASE_URL;
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;

if (!BASE || !EMAIL || !TOKEN) {
  throw new Error('Missing env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN');
}

// --- HTTP client ---
const client = axios.create({
  baseURL: `${BASE.replace(/\/+$/, '')}/rest/api/3`,
  headers: {
    'Authorization': `Basic ${Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')}`,
    'Accept': 'application/json'
  },
  validateStatus: s => s < 500
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- Config ---
let JQL = (process.env.JQL || 'order by created desc').trim();
const MAX_RESULTS = 100;
const EXPAND = process.env.EXPAND || 'names,renderedFields';
const FIELDS = (process.env.FIELDS && process.env.FIELDS.trim()) || [
  'summary','status','priority','assignee','reporter','labels','fixVersions',
  'components','project','issuetype','description','created','updated',
  'resolutiondate','customfield_10016','customfield_10020'
].join(',');

// --- Guard against unbounded JQL ---
const DEFAULT_BOUND = process.env.DEFAULT_BOUND || 'updated >= -30d';
const isUnboundedJql = jql => {
  if (!jql) return true;
  const j = jql.trim().replace(/\s+/g, ' ').toLowerCase();
  return /^order\s+by\s+/.test(j);
};
if (isUnboundedJql(JQL)) {
  JQL = `${DEFAULT_BOUND} ${JQL ? ' ' + JQL : ''}`.trim();
  console.warn(`[JQL guard] Unbounded JQL detected. Using bounded JQL: ${JQL}`);
}

// --- Rate limit helper ---
async function getWithBackoff(params, attempt = 0) {
  const res = await client.get('/search/jql', { params });
  if (res.status !== 429) return res;

  const retryAfter = parseInt(res.headers['retry-after'] || '0', 10);
  const delay =
    (retryAfter ? retryAfter * 1000 : Math.min(16000, 1000 * 2 ** attempt)) +
    Math.floor(Math.random() * 250);
  await sleep(delay);
  return getWithBackoff(params, attempt + 1);
}

// --- Fetch all issues (new nextPageToken pagination) ---
async function fetchAllIssues() {
  const all = [];
  let nextPageToken;

  for (;;) {
    const params = {
      jql: JQL,
      maxResults: MAX_RESULTS,
      fields: FIELDS,
      expand: EXPAND,
      ...(nextPageToken ? { nextPageToken } : {})
    };

    const res = await getWithBackoff(params);
    if (res.status !== 200) {
      throw new Error(`Search failed: ${res.status} ${JSON.stringify(res.data)}`);
    }

    const { issues = [], nextPageToken: token } = res.data || {};
    all.push(...issues);
    process.stdout.write(`Fetched ${all.length} issues\r`);

    if (!token || issues.length === 0) {
      process.stdout.write('\n');
      break;
    }
    nextPageToken = token;
  }
  return all;
}

// --- Flatten Jira issue into simple object ---
function flattenIssue(issue) {
  const f = issue.fields || {};
  const pick = (o, path, fallback = '') =>
    path.split('.').reduce((v, k) => (v && v[k] != null ? v[k] : null), o) ?? fallback;
  const join = a =>
    Array.isArray(a)
      ? a.map(v => (typeof v === 'string' ? v : v.name || v.value || v.id)).join(';')
      : '';

  return {
    key: issue.key || '',
    id: issue.id || '',
    type: pick(f, 'issuetype.name'),
    project: pick(f, 'project.key'),
    summary: f.summary || '',
    status: pick(f, 'status.name'),
    priority: pick(f, 'priority.name'),
    assignee: pick(f, 'assignee.displayName'),
    reporter: pick(f, 'reporter.displayName'),
    created: f.created || '',
    updated: f.updated || '',
    resolved: f.resolutiondate || '',
    sprint: join(pick(f, 'customfield_10020', [])),
    labels: (f.labels || []).join(';'),
    fixVersions: join(f.fixVersions),
    components: join(f.components),
    storyPoints: f.customfield_10016 ?? '',
    descriptionText:
      f.description && typeof f.description === 'object'
        ? extractAtlassianDocText(f.description)
        : f.description || ''
  };
}

// --- Convert Atlassian Document Format (ADF) description to plain text ---
function extractAtlassianDocText(doc) {
  const walk = node => {
    if (!node) return '';
    if (Array.isArray(node)) return node.map(walk).join('');
    const { text, content } = node;
    if (typeof text === 'string') return text;
    if (content) return content.map(walk).join('');
    return '';
  };
  return walk(doc);
}

// --- Main exportable function (returns CSV string) ---
async function getIssuesCsvString() {
  const issues = await fetchAllIssues();
  const rows = issues.map(flattenIssue);
  const parser = new Parser({ withBOM: true });
  const csv = parser.parse(rows);
  return csv;
}

module.exports = { getIssuesCsvString };