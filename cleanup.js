const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

const GS = '37b6b847-91e8-8025-99c1-f6185bd0fda7';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(m) { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }

async function api(method, path, body, retries = 3) {
  for (let a = 0; a <= retries; a++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const data = JSON.stringify(body || {});
        const req = https.request({
          hostname: 'api.notion.com', path: `/v1/${path}`, method, timeout: 30000,
          headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28', 'Content-Length': Buffer.byteLength(data) },
        }, res => {
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => {
            try {
              const p = JSON.parse(raw);
              if (res.statusCode === 429) { reject(Object.assign(new Error('rate_limited'), { retry: true })); return; }
              if (res.statusCode >= 200 && res.statusCode < 300) resolve(p);
              else reject(Object.assign(new Error(p.message || raw), { status: res.statusCode }));
            } catch (e) { reject(new Error('Bad JSON')); }
          });
        });
        req.on('timeout', () => { req.destroy(); reject(Object.assign(new Error('timed out'), { retry: true })); });
        req.on('error', reject);
        req.write(data); req.end();
      });
      await sleep(300);
      return result;
    } catch (err) {
      if (err.retry && a < retries) await sleep((a + 1) * 2000);
      else throw err;
    }
  }
}

async function main() {
  log('Fetching all pages under Getting Started...');

  let cursor = undefined;
  let allBlocks = [];

  do {
    const path = `blocks/${GS}/children?page_size=100${cursor ? '&start_cursor=' + cursor : ''}`;
    const res = await api('GET', path);
    allBlocks = allBlocks.concat(res.results || []);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  const pages = allBlocks.filter(b => b.type === 'child_page');
  log(`Found ${pages.length} pages to archive.`);

  if (pages.length === 0) {
    log('Nothing to clean up — Getting Started is already empty.');
    return;
  }

  for (const pg of pages) {
    const title = pg.child_page?.title || '(untitled)';
    try {
      await api('PATCH', `pages/${pg.id}`, { archived: true });
      log(`  ✅ Archived: "${title}"`);
    } catch (e) {
      log(`  ⚠️  Could not archive "${title}": ${e.message.slice(0, 80)}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('   Getting Started cleaned up.');
  console.log('══════════════════════════════════════════════════');
  console.log('\n📌 ALSO DO THIS MANUALLY IN NOTION:');
  console.log('   Delete any pages you already moved to Grydco\'s HQ');
  console.log('   (right-click → Delete on each one in the sidebar)');
  console.log('\n   Then run:  node workspace-v3.js');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
