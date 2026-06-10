const https = require('https');

const TOKEN  = process.env.NOTION_TOKEN;
const HQ_ID  = process.env.NOTION_HQ_ID; // set this to Grydco's HQ page ID

if (!TOKEN) { console.error('Set NOTION_TOKEN first: set NOTION_TOKEN=ntn_xxx'); process.exit(1); }

// ── IDs from the previous successful build ────────────────────────────────────
const OLD = {
  clients:    '37b6b847-91e8-8147-8dc5-d0f7dc381fda',
  operations: '37b6b847-91e8-8126-9421-eb0ebd647e1e',
  reporting:  '37b6b847-91e8-811b-95b1-d8892d1f1b40',
};
const DBS = {
  clientHub:       '37b6b847-91e8-8115-9892-d139d7fa0428',
  workflowTracker: '37b6b847-91e8-81c1-bed2-d9f3afad6390',
  contentCalendar: '37b6b847-91e8-81cc-ae0d-ebecf7d139fc',
  approvalLog:     '37b6b847-91e8-8153-808b-d51a18994bb0',
  revisionLog:     '37b6b847-91e8-8166-800c-dd4518cd5801',
  adsTracker:      '37b6b847-91e8-81bb-9922-c856c248ba7d',
  projectsTracker: '37b6b847-91e8-8104-a5fc-e550f9d22eb1',
  monthlyReports:  '37b6b847-91e8-81b2-b76b-c4c7c46f13f0',
};

// ── helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }
function u(id)     { return `https://www.notion.so/${id.replace(/-/g,'')}`; }

async function api(method, path, body, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const data = JSON.stringify(body || {});
        const req = https.request({
          hostname: 'api.notion.com',
          path: `/v1/${path}`,
          method,
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
            'Content-Length': Buffer.byteLength(data),
          },
        }, res => {
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              if (res.statusCode === 429) { reject(Object.assign(new Error('rate_limited'), { retry: true })); return; }
              if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
              else reject(Object.assign(new Error(parsed.message || raw), { status: res.statusCode, body: parsed }));
            } catch (e) { reject(new Error(`Bad JSON: ${raw.slice(0,200)}`)); }
          });
        });
        req.on('timeout', () => { req.destroy(); reject(Object.assign(new Error('timed out'), { retry: true })); });
        req.on('error', reject);
        req.write(data); req.end();
      });
      await sleep(400);
      return result;
    } catch (err) {
      if (err.retry && attempt < retries) { await sleep((attempt+1)*2000); }
      else throw err;
    }
  }
}

// ── API wrappers ──────────────────────────────────────────────────────────────
const createPage = (parentId, title, emoji) => api('POST', 'pages', {
  parent: { type: 'page_id', page_id: parentId },
  icon: { type: 'emoji', emoji },
  properties: { title: { title: [{ type: 'text', text: { content: title } }] } },
});

const movePage = (id, newParentId) => api('PATCH', `pages/${id}`, {
  parent: { type: 'page_id', page_id: newParentId },
});

const renamePage = (id, title, emoji) => api('PATCH', `pages/${id}`, {
  icon: { type: 'emoji', emoji },
  properties: { title: { title: [{ type: 'text', text: { content: title } }] } },
});

const appendBlocks = (pageId, children) => api('PATCH', `blocks/${pageId}/children`, { children });

// ── block builders ────────────────────────────────────────────────────────────
const h1  = t  => ({ type:'heading_1',   heading_1:   { rich_text:[{type:'text',text:{content:t}}] } });
const h2  = t  => ({ type:'heading_2',   heading_2:   { rich_text:[{type:'text',text:{content:t}}] } });
const h3  = t  => ({ type:'heading_3',   heading_3:   { rich_text:[{type:'text',text:{content:t}}] } });
const p   = t  => ({ type:'paragraph',   paragraph:   { rich_text:[{type:'text',text:{content:t}}] } });
const div = () => ({ type:'divider',     divider:     {} });
const bul = (t, link) => ({
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type:'text', text: link ? {content:t,link:{url:link}} : {content:t} }] },
});
const callout = (t, emoji) => ({
  type: 'callout',
  callout: { rich_text:[{type:'text',text:{content:t}}], icon:{type:'emoji',emoji} },
});

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('Starting Gryd Co. workspace reorganisation...');

  // ── 1. Find Grydco's HQ ──────────────────────────────────────────────────
  let hqId = HQ_ID;
  if (!hqId) {
    log("Searching for Grydco's HQ...");
    const res = await api('POST', 'search', { page_size: 20 });
    const hq = res.results.find(r => {
      const t = r.properties?.title?.title?.[0]?.plain_text || r.title?.[0]?.plain_text || '';
      return /grydco.{0,10}hq|hq.{0,10}grydco/i.test(t);
    });
    hqId = hq?.id;
  }

  if (!hqId) {
    console.error('\n❌  Could not find Grydco\'s HQ.');
    console.error('Please:');
    console.error('  1. In Notion, click "Grydco\'s HQ" in the left sidebar');
    console.error('  2. Click ... → Connections → enable Gryd Co. Build integration');
    console.error('  3. Copy the page ID from the URL and run:');
    console.error('       set NOTION_HQ_ID=<page-id>');
    console.error('       node reorganize.js');
    process.exit(1);
  }
  log(`✅ Found Grydco's HQ: ${hqId}`);

  // ── 2. Move existing container pages into Grydco's HQ ───────────────────
  log("Moving Clients, Operations, Reporting → Grydco's HQ...");
  await movePage(OLD.clients,    hqId); log('  ✅ Clients moved');
  await movePage(OLD.operations, hqId); log('  ✅ Operations moved');
  await movePage(OLD.reporting,  hqId); log('  ✅ Reporting moved');

  // ── 3. Rename them to match final hierarchy ──────────────────────────────
  await renamePage(OLD.clients,    '👥 Clients',    '👥'); log('  ✅ Renamed: 👥 Clients');
  await renamePage(OLD.operations, '⚙️ Operations', '⚙️'); log('  ✅ Renamed: ⚙️ Operations');
  await renamePage(OLD.reporting,  '📊 Reporting',  '📊'); log('  ✅ Renamed: 📊 Reporting');

  // ── 4. Create new sections under Grydco's HQ ────────────────────────────
  log('Creating Performance Marketing and Projects sections...');
  const perfPage    = await createPage(hqId, '📢 Performance Marketing', '📢');
  log(`  ✅ Performance Marketing: ${perfPage.id}`);
  const projPage    = await createPage(hqId, '🎨 Projects', '🎨');
  log(`  ✅ Projects: ${projPage.id}`);

  // ── 5. Create sub-pages ──────────────────────────────────────────────────
  log('Creating sub-pages...');
  await createPage(OLD.clients, 'Client Portal', '🔗');     log('  ✅ Client Portal');
  await createPage(OLD.clients, 'All Brands',    '💎');     log('  ✅ All Brands');
  await createPage(projPage.id, 'Branding Projects', '🖌️'); log('  ✅ Branding Projects');
  await createPage(projPage.id, 'Website Projects',  '🌐'); log('  ✅ Website Projects');

  // ── 6. Build Founder Dashboard ───────────────────────────────────────────
  log('Building Founder Dashboard...');
  const dash = await createPage(hqId, '🏠 Founder Dashboard', '🏠');

  await appendBlocks(dash.id, [
    callout('Central command for Gryd Co. — client health, team workload, approvals, and performance at a glance.', '🏠'),
    div(),

    h2('📋 Agency Overview'),
    h3('Team'),
    bul('Manika — Team Lead'),
    bul('Tia — Social Media Manager'),
    bul('Vanshika — Social Media Manager'),
    bul('Mahima — Designer'),
    bul('Durga — Designer'),
    bul('Pratyusha — Digital Marketer'),
    h3('Active Clients (10)'),
    bul('Aarni by Sharavani · Atul Jewellers · Bhagat Jewellers · Beri Jewellers · Gujranwala Jewellers'),
    bul('Luminique · Vidhi Sheth · Karan Kothari Jewellers · Avani · Elmara'),
    div(),

    h2('⚠️ Delayed Tasks'),
    callout('Open Workflow Tracker → filter by Status = Blocked, or Due Date is past. Then use "Create linked database view" to embed it here.', '📋'),
    bul('→ Open Workflow Tracker', u(DBS.workflowTracker)),
    div(),

    h2('✅ Pending Approvals'),
    callout('Open Approval Log → filter Client Status = Pending. Then embed the filtered view here.', '✅'),
    bul('→ Open Approval Log', u(DBS.approvalLog)),
    div(),

    h2('👥 Team Workload Snapshot'),
    callout('Open Workflow Tracker → switch to Board view → group by Owner to see each person\'s tasks.', '📊'),
    bul('→ Open Workflow Tracker', u(DBS.workflowTracker)),
    div(),

    h2('🔗 Quick Access'),
    h3('👥 Clients'),
    bul('Client Hub',          u(DBS.clientHub)),
    h3('⚙️ Operations'),
    bul('Workflow Tracker',    u(DBS.workflowTracker)),
    bul('Content Calendar',    u(DBS.contentCalendar)),
    bul('Approval Log',        u(DBS.approvalLog)),
    bul('Revision Log',        u(DBS.revisionLog)),
    h3('📢 Performance Marketing'),
    bul('Ads Tracker',         u(DBS.adsTracker)),
    h3('🎨 Projects'),
    bul('Projects Tracker',    u(DBS.projectsTracker)),
    h3('📊 Reporting'),
    bul('Monthly Reports',     u(DBS.monthlyReports)),
  ]);
  log('  ✅ Founder Dashboard built');

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   Gryd Co. workspace reorganisation COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✅ Done via API:');
  console.log('   • Clients, Operations, Reporting → moved to Grydco\'s HQ');
  console.log('   • 👥 Clients renamed + Client Portal, All Brands added');
  console.log('   • ⚙️ Operations renamed');
  console.log('   • 📢 Performance Marketing section created');
  console.log('   • 🎨 Projects section + Branding & Website sub-pages created');
  console.log('   • 📊 Reporting renamed');
  console.log('   • 🏠 Founder Dashboard built with content');
  console.log('\n🖱️  2 quick drag-and-drops needed in Notion sidebar:');
  console.log('   1. Drag  📣 Ads Tracker       →  inside  📢 Performance Marketing');
  console.log('   2. Drag  🚀 Projects Tracker  →  inside  🎨 Projects');
  console.log('\n🔗 Open your workspace:');
  console.log(`   🏠 Founder Dashboard → ${u(dash.id)}`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (err.body) console.error('   Detail:', JSON.stringify(err.body, null, 2));
  process.exit(1);
});
