#!/usr/bin/env node

/**
 * Professor Search
 *
 * Searches for US-based professors/researchers by topic using the OpenAlex API.
 * No API key required.
 *
 * Usage:
 *   node professor-search.js <topic>
 *   node professor-search.js <topic> --page <number>
 *   node professor-search.js <topic> --limit <number>
 *
 * Examples:
 *   node professor-search.js landscaping
 *   node professor-search.js "machine learning" --limit 10
 *   node professor-search.js "urban planning" --page 2
 */

const https = require('https');
const readline = require('readline');

// ─── Config ──────────────────────────────────────────────────────────────────

const OPENALEX_BASE = 'https://api.openalex.org';
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;
const EMAIL_POLITE = 'professor-search@example.com'; // OpenAlex "polite pool" – faster responses

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const options = new URL(url);
        const req = https.get(
            {
                hostname: options.hostname,
                path: options.pathname + options.search,
                headers: {
                    'User-Agent': `professor-search/1.0 (mailto:${EMAIL_POLITE})`,
                    Accept: 'application/json',
                },
            },
            (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                    res.resume();
                    return;
                }
                let raw = '';
                res.on('data', (chunk) => (raw += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch (e) {
                        reject(new Error('Failed to parse response JSON'));
                    }
                });
            }
        );
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy(new Error('Request timed out after 15s'));
        });
    });
}

// ─── OpenAlex helpers ─────────────────────────────────────────────────────────

/**
 * Resolve a topic string to an OpenAlex concept ID.
 * Returns the best-matching concept or null if none found.
 */
async function resolveConcept(topic) {
    const url =
        `${OPENALEX_BASE}/concepts?search=${encodeURIComponent(topic)}` +
        `&per-page=5&select=id,display_name,description,level,works_count`;
    const data = await fetchJSON(url);
    if (!data.results || data.results.length === 0) return null;

    // Prefer an exact (case-insensitive) match; otherwise take the top result
    const exact = data.results.find(
        (c) => c.display_name.toLowerCase() === topic.toLowerCase()
    );
    return exact || data.results[0];
}

/**
 * Search OpenAlex authors who:
 *  - Are at a US institution
 *  - Have the given concept in their expertise
 */
async function searchAuthors({ conceptId, topicQuery, page, limit }) {
    const filters = ['last_known_institution.country_code:US'];
    if (conceptId) filters.push(`x_concepts.id:${conceptId}`);

    const params = new URLSearchParams({
        filter: filters.join(','),
        search: topicQuery,
        'per-page': limit,
        page,
        select: [
            'id',
            'display_name',
            'last_known_institution',
            'x_concepts',
            'works_count',
            'cited_by_count',
            'orcid',
            'ids',
        ].join(','),
        sort: 'cited_by_count:desc',
    });

    const url = `${OPENALEX_BASE}/authors?${params}`;
    return fetchJSON(url);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';

function hr(char = '─', width = 80) {
    return char.repeat(width);
}

function formatCount(n) {
    if (n === null || n === undefined) return 'N/A';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function printProfessor(prof, index) {
    const name = prof.display_name || 'Unknown';
    const inst = prof.last_known_institution;
    const instName = inst ? inst.display_name : 'Unknown institution';
    const instCity = inst && inst.city ? inst.city : null;
    const instState = inst && inst.country_code ? inst.country_code : null;
    const works = formatCount(prof.works_count);
    const citations = formatCount(prof.cited_by_count);

    // Top 6 concepts, skip generic ones
    const skipConcepts = new Set(['computer science', 'biology', 'chemistry', 'physics', 'medicine', 'mathematics']);
    const concepts = (prof.x_concepts || [])
        .filter((c) => c.score > 0.3 && !skipConcepts.has(c.display_name.toLowerCase()))
        .slice(0, 6)
        .map((c) => c.display_name);

    const openAlexId = prof.id ? prof.id.replace('https://openalex.org/', '') : null;
    const scholarUrl =
        prof.ids && prof.ids.google_scholar
            ? `https://scholar.google.com${prof.ids.google_scholar}`
            : null;

    console.log(`\n${BOLD}${CYAN}${index}. ${name}${RESET}`);
    console.log(
        `   ${BOLD}Institution:${RESET} ${instName}` +
            (instCity ? ` · ${instCity}` : '') +
            (instState ? `, ${instState}` : '')
    );
    console.log(
        `   ${BOLD}Works:${RESET} ${GREEN}${works}${RESET}   ` +
            `${BOLD}Citations:${RESET} ${YELLOW}${citations}${RESET}`
    );

    if (concepts.length > 0) {
        console.log(`   ${BOLD}Expertise:${RESET} ${MAGENTA}${concepts.join(' · ')}${RESET}`);
    }

    if (prof.orcid) {
        console.log(`   ${BOLD}ORCID:${RESET} ${DIM}${prof.orcid}${RESET}`);
    }
    if (scholarUrl) {
        console.log(`   ${BOLD}Google Scholar:${RESET} ${BLUE}${scholarUrl}${RESET}`);
    }
    if (openAlexId) {
        console.log(`   ${BOLD}OpenAlex:${RESET} ${DIM}https://openalex.org/${openAlexId}${RESET}`);
    }

    console.log(`   ${DIM}${hr('·', 76)}${RESET}`);
}

function printHeader(topic, total, page, limit) {
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const totalPages = Math.ceil(total / limit);

    console.log('\n' + hr('═'));
    console.log(
        `${BOLD}  Professor Search${RESET}  ·  Topic: ${CYAN}${BOLD}"${topic}"${RESET}`
    );
    console.log(
        `  Found ${YELLOW}${BOLD}${total.toLocaleString()}${RESET} US-based researchers` +
            `  ·  Showing ${from}–${to}  ·  Page ${page}/${totalPages}`
    );
    console.log(hr('═'));
}

function printFooter(topic, page, total, limit) {
    const totalPages = Math.ceil(total / limit);
    console.log('\n' + hr());
    if (page < totalPages) {
        console.log(
            `${DIM}  Next page:  node professor-search.js "${topic}" --page ${page + 1} --limit ${limit}${RESET}`
        );
    }
    console.log(`${DIM}  Data source: OpenAlex (https://openalex.org)${RESET}`);
    console.log(hr() + '\n');
}

// ─── Interactive mode ─────────────────────────────────────────────────────────

async function interactiveMode() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((res) => rl.question(q, res));

    console.log('\n' + hr('═'));
    console.log(`${BOLD}  Professor Search – Interactive Mode${RESET}`);
    console.log(hr('═') + '\n');

    while (true) {
        const topic = (await ask(`${CYAN}Enter topic (or "quit" to exit):${RESET} `)).trim();
        if (!topic || topic.toLowerCase() === 'quit' || topic.toLowerCase() === 'q') break;

        const limitInput = (await ask(`${DIM}  Results per page [${DEFAULT_LIMIT}]:${RESET} `)).trim();
        const limit = Math.min(parseInt(limitInput) || DEFAULT_LIMIT, MAX_LIMIT);

        rl.close();
        await runSearch({ topic, page: 1, limit });
        return;
    }

    rl.close();
}

// ─── Core search flow ─────────────────────────────────────────────────────────

async function runSearch({ topic, page, limit }) {
    process.stdout.write(`\n  Searching for "${topic}" ...\r`);

    let conceptId = null;
    try {
        const concept = await resolveConcept(topic);
        if (concept) {
            conceptId = concept.id;
            process.stdout.write(
                `  Mapped to concept: ${CYAN}${concept.display_name}${RESET} (${formatCount(concept.works_count)} works)\n`
            );
        }
    } catch {
        // concept resolution is best-effort
    }

    let data;
    try {
        data = await searchAuthors({ conceptId, topicQuery: topic, page, limit });
    } catch (err) {
        console.error(`\n  ${BOLD}Error:${RESET} ${err.message}`);
        process.exit(1);
    }

    const results = data.results || [];
    const total = data.meta ? data.meta.count : results.length;

    if (results.length === 0) {
        console.log(`\n  No US professors found for topic: "${topic}"\n`);
        console.log('  Tips:');
        console.log('    · Try broader keywords (e.g. "landscape architecture" instead of "landscaping")');
        console.log('    · Try synonyms or related fields');
        process.exit(0);
    }

    printHeader(topic, total, page, limit);
    results.forEach((prof, i) => printProfessor(prof, (page - 1) * limit + i + 1));
    printFooter(topic, page, total, limit);
}

// ─── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = { topic: null, page: 1, limit: DEFAULT_LIMIT, interactive: false };

    if (args.length === 0) {
        opts.interactive = true;
        return opts;
    }

    // First positional arg = topic (unless it starts with --)
    if (args[0] && !args[0].startsWith('--')) {
        opts.topic = args[0];
    }

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--page' && args[i + 1]) {
            opts.page = Math.max(1, parseInt(args[++i]) || 1);
        } else if (args[i] === '--limit' && args[i + 1]) {
            opts.limit = Math.min(Math.max(1, parseInt(args[++i]) || DEFAULT_LIMIT), MAX_LIMIT);
        } else if (args[i] === '--interactive' || args[i] === '-i') {
            opts.interactive = true;
        } else if (args[i] === '--help' || args[i] === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    return opts;
}

function printHelp() {
    console.log(`
${BOLD}professor-search${RESET} — Find US professors by research topic

${BOLD}USAGE${RESET}
  node professor-search.js <topic> [options]
  node professor-search.js              # interactive mode

${BOLD}OPTIONS${RESET}
  --page <n>      Page number (default: 1)
  --limit <n>     Results per page, max 50 (default: ${DEFAULT_LIMIT})
  --interactive   Launch interactive prompt
  --help          Show this help

${BOLD}EXAMPLES${RESET}
  node professor-search.js landscaping
  node professor-search.js "urban planning" --limit 20
  node professor-search.js "machine learning" --page 3
  node professor-search.js "renewable energy" --limit 25 --page 2

${BOLD}DATA SOURCE${RESET}
  OpenAlex (https://openalex.org) — free, open academic graph
  No API key required.
`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

(async () => {
    const opts = parseArgs(process.argv);

    if (opts.interactive || !opts.topic) {
        await interactiveMode();
        return;
    }

    await runSearch({ topic: opts.topic, page: opts.page, limit: opts.limit });
})();
