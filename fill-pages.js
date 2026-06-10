const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

// Known IDs
const IDS = {
  gettingStarted:  '37b6b847-91e8-8025-99c1-f6185bd0fda7',
  clients:         '37b6b847-91e8-8147-8dc5-d0f7dc381fda',
  operations:      '37b6b847-91e8-8126-9421-eb0ebd647e1e',
  clientHub:       '37b6b847-91e8-8115-9892-d139d7fa0428',
  workflowTracker: '37b6b847-91e8-81c1-bed2-d9f3afad6390',
  contentCalendar: '37b6b847-91e8-81cc-ae0d-ebecf7d139fc',
  approvalLog:     '37b6b847-91e8-8153-808b-d51a18994bb0',
  revisionLog:     '37b6b847-91e8-8166-800c-dd4518cd5801',
  adsTracker:      '37b6b847-91e8-81bb-9922-c856c248ba7d',
  projectsTracker: '37b6b847-91e8-8104-a5fc-e550f9d22eb1',
  monthlyReports:  '37b6b847-91e8-81b2-b76b-c4c7c46f13f0',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(m) { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function u(id) { return `https://www.notion.so/${id.replace(/-/g, '')}`; }

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
            } catch (e) { reject(new Error('Bad JSON: ' + raw.slice(0, 100))); }
          });
        });
        req.on('timeout', () => { req.destroy(); reject(Object.assign(new Error('timed out'), { retry: true })); });
        req.on('error', reject);
        req.write(data); req.end();
      });
      await sleep(400);
      return result;
    } catch (err) {
      if (err.retry && a < retries) await sleep((a + 1) * 2000);
      else throw err;
    }
  }
}

const mkPage = (pid, title, emoji) => api('POST', 'pages', {
  parent: { type: 'page_id', page_id: pid },
  icon: { type: 'emoji', emoji },
  properties: { title: { title: [{ type: 'text', text: { content: title } }] } },
});

const addBlocks = (pid, children) => api('PATCH', `blocks/${pid}/children`, { children });

// Block helpers
const h1  = t => ({ type: 'heading_1',  heading_1:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const h2  = t => ({ type: 'heading_2',  heading_2:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const h3  = t => ({ type: 'heading_3',  heading_3:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const p   = t => ({ type: 'paragraph',  paragraph:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const div = () => ({ type: 'divider',   divider: {} });
const bul = (t, link) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: link ? { content: t, link: { url: link } } : { content: t } }] } });
const callout = (t, emoji) => ({ type: 'callout', callout: { rich_text: [{ type: 'text', text: { content: t } }], icon: { type: 'emoji', emoji } } });
const toggle = (t, children) => ({ type: 'toggle', toggle: { rich_text: [{ type: 'text', text: { content: t } }], children } });

async function main() {
  log('Filling Gryd Co. pages with content...');

  // ── 1. FOUNDER DASHBOARD ──────────────────────────────────────────────────
  log('Building Founder Dashboard...');
  const dash = await mkPage(IDS.gettingStarted, '🏠 Founder Dashboard', '🏠');
  await addBlocks(dash.id, [
    callout('Your central command for Gryd Co. — client health, team workload, approvals and performance at a glance.', '🏠'),
    div(),

    h2('📋 Agency Overview'),
    h3('Team'),
    bul('Manika — Team Lead'),
    bul('Tia — Social Media Manager'),
    bul('Vanshika — Social Media Manager'),
    bul('Mahima — Designer'),
    bul('Durga — Designer'),
    bul('Pratyusha — Digital Marketer'),
    p(''),
    h3('Active Clients — 10'),
    bul('Aarni by Sharavani  ·  Tia  ·  Social Media + Ads'),
    bul('Atul Jewellers  ·  Vanshika  ·  Social Media + Ads + Branding'),
    bul('Bhagat Jewellers  ·  Tia  ·  Social Media'),
    bul('Beri Jewellers  ·  Vanshika  ·  Social Media + Ads'),
    bul('Gujranwala Jewellers  ·  Tia  ·  Social Media + Ads'),
    bul('Luminique  ·  Vanshika  ·  Social Media + Ads + Branding'),
    bul('Vidhi Sheth  ·  Tia  ·  Social Media'),
    bul('Karan Kothari Jewellers  ·  Vanshika  ·  Social Media + Ads'),
    bul('Avani  ·  Tia  ·  Branding (in progress)'),
    bul('Elmara  ·  Vanshika  ·  Website (in progress)'),
    div(),

    h2('⚠️ Delayed Tasks'),
    callout('Open Workflow Tracker → filter Status = Blocked. Pin that filtered view here using /linked view of database.', '📋'),
    bul('→ Workflow Tracker', u(IDS.workflowTracker)),
    div(),

    h2('✅ Pending Approvals'),
    callout('Open Approval Log → filter Client Status = Pending. Pin the filtered view here.', '✅'),
    bul('→ Approval Log', u(IDS.approvalLog)),
    div(),

    h2('👥 Team Workload Snapshot'),
    callout('Open Workflow Tracker → Board view → Group by Owner to see each person\'s load.', '📊'),
    bul('→ Workflow Tracker', u(IDS.workflowTracker)),
    div(),

    h2('🔗 Quick Access'),
    h3('Clients'),
    bul('Client Hub — all 10 clients, budgets, handles', u(IDS.clientHub)),
    h3('Operations'),
    bul('Workflow Tracker', u(IDS.workflowTracker)),
    bul('Content Calendar', u(IDS.contentCalendar)),
    bul('Approval Log',     u(IDS.approvalLog)),
    bul('Revision Log',     u(IDS.revisionLog)),
    h3('Performance Marketing'),
    bul('Ads Tracker — live campaigns, budgets, ROAS', u(IDS.adsTracker)),
    h3('Projects'),
    bul('Projects Tracker — shoots, branding, websites', u(IDS.projectsTracker)),
    h3('Reporting'),
    bul('Monthly Reports', u(IDS.monthlyReports)),
  ]);
  log(`  ✅ Founder Dashboard → ${u(dash.id)}`);

  // ── 2. PERFORMANCE MARKETING (top-level section) ──────────────────────────
  log('Building Performance Marketing section...');
  const perf = await mkPage(IDS.gettingStarted, '📢 Performance Marketing', '📢');
  await addBlocks(perf.id, [
    callout('Track all paid campaigns across Meta and Google. Monitor budgets, spend and performance in one place.', '📢'),
    div(),
    h2('📣 Ads Tracker'),
    bul('→ Open Ads Tracker', u(IDS.adsTracker)),
    p(''),
    callout('Tip: Drag the Ads Tracker database from Operations into this page using the Notion sidebar.', '💡'),
    div(),
    h2('Active Campaigns'),
    bul('Aarni — Awareness June 2026  ·  Meta Video  ·  Budget ₹25,000  ·  Live'),
    bul('Beri — Conversion Campaign Q2  ·  Meta Carousel  ·  Budget ₹40,000  ·  Live'),
    bul('Gujranwala — Bridal Season Ads  ·  Meta Static  ·  Budget ₹30,000  ·  Paused'),
    div(),
    h2('Clients on Ads'),
    bul('Aarni by Sharavani — Meta'),
    bul('Atul Jewellers — Meta'),
    bul('Beri Jewellers — Meta'),
    bul('Gujranwala Jewellers — Meta'),
    bul('Luminique — Meta'),
    bul('Karan Kothari Jewellers — Meta'),
  ]);
  log(`  ✅ Performance Marketing → ${u(perf.id)}`);

  // ── 3. PROJECTS SECTION ───────────────────────────────────────────────────
  log('Building Projects section...');
  const proj = await mkPage(IDS.gettingStarted, '🎨 Projects', '🎨');
  await addBlocks(proj.id, [
    callout('Track all non-social deliverables — photo shoots, branding, and website builds.', '🎨'),
    div(),
    h2('🔗 Projects Tracker'),
    bul('→ Open Projects Tracker', u(IDS.projectsTracker)),
    div(),
    h2('Active Projects'),
    bul('Avani — Brand Identity  ·  Branding  ·  In Progress  ·  Due June 30'),
    bul('Elmara — Website Build  ·  Website  ·  Briefed  ·  Due July 15'),
    bul('Atul Jewellers — Q2 Product Shoot  ·  Photo Shoot  ·  Delivered'),
  ]);
  log(`  ✅ Projects → ${u(proj.id)}`);

  // Branding Projects sub-page
  const brandingProj = await mkPage(proj.id, '🖌️ Branding Projects', '🖌️');
  await addBlocks(brandingProj.id, [
    callout('All active and completed branding projects. Filter Projects Tracker by Type = Branding to see live data.', '🖌️'),
    div(),
    h2('Active Branding Projects'),
    bul('Avani — Brand Identity', u(IDS.projectsTracker)),
    bul('Atul Jewellers — Branding Deck'),
    bul('Luminique — Brand Guidelines'),
    div(),
    h2('What Branding Includes'),
    bul('Logo design & variations'),
    bul('Colour palette & typography'),
    bul('Brand guidelines document'),
    bul('Social media templates'),
    bul('Visual identity system'),
    div(),
    bul('→ View all in Projects Tracker', u(IDS.projectsTracker)),
  ]);
  log(`  ✅ Branding Projects → ${u(brandingProj.id)}`);

  // Website Projects sub-page
  const websiteProj = await mkPage(proj.id, '🌐 Website Projects', '🌐');
  await addBlocks(websiteProj.id, [
    callout('All active and completed website builds. Filter Projects Tracker by Type = Website to see live data.', '🌐'),
    div(),
    h2('Active Website Projects'),
    bul('Elmara — Website Build  ·  Briefed  ·  Delivery July 15', u(IDS.projectsTracker)),
    div(),
    h2('What Website Projects Include'),
    bul('Wireframes & UX design'),
    bul('Design handoff to developer'),
    bul('Content preparation'),
    bul('QA & testing'),
    bul('Launch & go-live'),
    div(),
    bul('→ View all in Projects Tracker', u(IDS.projectsTracker)),
  ]);
  log(`  ✅ Website Projects → ${u(websiteProj.id)}`);

  // ── 4. CLIENT PORTAL (under existing Clients page) ────────────────────────
  log('Building Client Portal...');
  const portal = await mkPage(IDS.clients, '🔗 Client Portal', '🔗');
  await addBlocks(portal.id, [
    callout('One-stop reference for all 10 active clients — SMM owner, services, handles and key notes.', '🔗'),
    div(),
    h2('Tia\'s Clients'),
    toggle('Aarni by Sharavani — Social Media + Ads', [
      bul('Instagram: @aarnibysharavani'),
      bul('SMM: Tia'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Fine Jewellery'),
    ]),
    toggle('Bhagat Jewellers — Social Media', [
      bul('Instagram: @bhagatjewellers'),
      bul('SMM: Tia'),
      bul('Services: Social Media'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Gujranwala Jewellers — Social Media + Ads', [
      bul('Instagram: @gujranwalajewellers'),
      bul('SMM: Tia'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Vidhi Sheth — Social Media', [
      bul('Instagram: @vidhisheth'),
      bul('SMM: Tia'),
      bul('Services: Social Media'),
      bul('Industry: Fine Jewellery'),
    ]),
    toggle('Avani — Branding (in progress)', [
      bul('Instagram: @avani.jewels'),
      bul('SMM: Tia'),
      bul('Services: Branding'),
      bul('Industry: Fine Jewellery'),
      bul('Note: Brand identity in progress with Studio Ink. Due June 30.'),
    ]),
    div(),
    h2('Vanshika\'s Clients'),
    toggle('Atul Jewellers — Social Media + Ads + Branding', [
      bul('Instagram: @atuljewellers'),
      bul('SMM: Vanshika'),
      bul('Services: Social Media, Ads (Meta), Branding'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Beri Jewellers — Social Media + Ads', [
      bul('Instagram: @berijewellers'),
      bul('SMM: Vanshika'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Luminique — Social Media + Ads + Branding', [
      bul('Instagram: @luminique'),
      bul('SMM: Vanshika'),
      bul('Services: Social Media, Ads (Meta), Branding'),
      bul('Industry: Luxury'),
    ]),
    toggle('Karan Kothari Jewellers — Social Media + Ads', [
      bul('Instagram: @karankotharijewellers'),
      bul('SMM: Vanshika'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Elmara — Website (in progress)', [
      bul('Instagram: @elmara'),
      bul('SMM: Vanshika'),
      bul('Services: Website'),
      bul('Industry: Luxury'),
      bul('Note: Website build in progress with PixelCraft Studio. Due July 15.'),
    ]),
    div(),
    bul('→ Full client database with budgets & contracts', u(IDS.clientHub)),
  ]);
  log(`  ✅ Client Portal → ${u(portal.id)}`);

  // ── 5. ALL BRANDS (under existing Clients page) ───────────────────────────
  log('Building All Brands page...');
  const brands = await mkPage(IDS.clients, '💎 All Brands', '💎');
  await addBlocks(brands.id, [
    callout('Brand reference sheet — Instagram handles, niche, and service scope for all 10 Gryd Co. clients.', '💎'),
    div(),
    h2('Jewellery Brands'),
    bul('Aarni by Sharavani — Fine jewellery, solitaires  ·  @aarnibysharavani'),
    bul('Atul Jewellers — Traditional + bridal jewellery  ·  @atuljewellers'),
    bul('Bhagat Jewellers — Classic jewellery  ·  @bhagatjewellers'),
    bul('Beri Jewellers — Statement jewellery  ·  @berijewellers'),
    bul('Gujranwala Jewellers — Heritage jewellery  ·  @gujranwalajewellers'),
    bul('Vidhi Sheth — Contemporary fine jewellery  ·  @vidhisheth'),
    bul('Karan Kothari Jewellers — Premium jewellery  ·  @karankotharijewellers'),
    bul('Avani — Fine jewellery, branding phase  ·  @avani.jewels'),
    div(),
    h2('Luxury Brands'),
    bul('Luminique — Luxury jewellery & lifestyle  ·  @luminique'),
    bul('Elmara — Luxury brand, website phase  ·  @elmara'),
    div(),
    bul('→ Full client database', u(IDS.clientHub)),
  ]);
  log(`  ✅ All Brands → ${u(brands.id)}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   All pages filled with content!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n🔗 New pages (created under Getting Started):');
  console.log(`   🏠 Founder Dashboard     → ${u(dash.id)}`);
  console.log(`   📢 Perf. Marketing       → ${u(perf.id)}`);
  console.log(`   🎨 Projects              → ${u(proj.id)}`);
  console.log(`      🖌️  Branding Projects  → ${u(brandingProj.id)}`);
  console.log(`      🌐 Website Projects   → ${u(websiteProj.id)}`);
  console.log('\n📌 Already in Grydco\'s HQ (content added):');
  console.log(`   👥 Clients → 🔗 Client Portal  → ${u(portal.id)}`);
  console.log(`   👥 Clients → 💎 All Brands     → ${u(brands.id)}`);
  console.log('\n📌 Move these 3 pages to Grydco\'s HQ:');
  console.log('   Right-click each in sidebar → Move to → Grydco\'s HQ');
  console.log('   1. 🏠 Founder Dashboard');
  console.log('   2. 📢 Performance Marketing');
  console.log('   3. 🎨 Projects');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
