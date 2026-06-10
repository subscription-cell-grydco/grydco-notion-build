const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

const IDS = {
  gettingStarted:  '37b6b847-91e8-8025-99c1-f6185bd0fda7',
  clients:         '37b6b847-91e8-8147-8dc5-d0f7dc381fda',
  adsTracker:      '37b6b847-91e8-81bb-9922-c856c248ba7d',
  projectsTracker: '37b6b847-91e8-8104-a5fc-e550f9d22eb1',
  monthlyReports:  '37b6b847-91e8-81b2-b76b-c4c7c46f13f0',
  clientHub:       '37b6b847-91e8-8115-9892-d139d7fa0428',
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
            } catch (e) { reject(new Error('Bad JSON')); }
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

const h2  = t  => ({ type: 'heading_2',  heading_2:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const h3  = t  => ({ type: 'heading_3',  heading_3:  { rich_text: [{ type: 'text', text: { content: t } }] } });
const div = () => ({ type: 'divider',    divider: {} });
const bul = (t, link) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: link ? { content: t, link: { url: link } } : { content: t } }] } });
const callout = (t, emoji) => ({ type: 'callout', callout: { rich_text: [{ type: 'text', text: { content: t } }], icon: { type: 'emoji', emoji } } });
const toggle = (t, children) => ({ type: 'toggle', toggle: { rich_text: [{ type: 'text', text: { content: t } }], children } });

async function main() {
  log('Creating remaining pages...');

  // ── 1. PROJECTS SECTION ───────────────────────────────────────────────────
  log('Building 🎨 Projects...');
  const proj = await mkPage(IDS.gettingStarted, '🎨 Projects', '🎨');
  await addBlocks(proj.id, [
    callout('Track all non-social deliverables — photo shoots, branding, and website builds.', '🎨'),
    div(),
    h2('Active Projects'),
    bul('Avani — Brand Identity  ·  Branding  ·  In Progress  ·  Due June 30'),
    bul('Elmara — Website Build  ·  Website  ·  Briefed  ·  Due July 15'),
    bul('Atul Jewellers — Q2 Product Shoot  ·  Photo Shoot  ·  Delivered'),
    div(),
    bul('→ Projects Tracker', u(IDS.projectsTracker)),
  ]);
  log(`  ✅ Projects: ${u(proj.id)}`);

  const brandingProj = await mkPage(proj.id, '🖌️ Branding Projects', '🖌️');
  await addBlocks(brandingProj.id, [
    callout('All branding projects. Filter Projects Tracker → Type = Branding.', '🖌️'),
    div(),
    h2('Active'),
    bul('Avani — Brand Identity  ·  Studio Ink  ·  In Progress  ·  Due June 30'),
    bul('Atul Jewellers — Branding Deck  ·  Client revision requested'),
    bul('Luminique — Brand Guidelines  ·  In Progress'),
    div(),
    h2('Deliverables'),
    bul('Logo design & variations'),
    bul('Colour palette & typography'),
    bul('Brand guidelines document'),
    bul('Social media templates'),
    div(),
    bul('→ Projects Tracker', u(IDS.projectsTracker)),
  ]);
  log(`  ✅ Branding Projects: ${u(brandingProj.id)}`);

  const websiteProj = await mkPage(proj.id, '🌐 Website Projects', '🌐');
  await addBlocks(websiteProj.id, [
    callout('All website builds. Filter Projects Tracker → Type = Website.', '🌐'),
    div(),
    h2('Active'),
    bul('Elmara — Website Build  ·  PixelCraft Studio  ·  Briefed  ·  Due July 15'),
    div(),
    h2('Deliverables'),
    bul('Wireframes & UX design'),
    bul('Design handoff to developer'),
    bul('Content preparation'),
    bul('QA, testing & go-live'),
    div(),
    bul('→ Projects Tracker', u(IDS.projectsTracker)),
  ]);
  log(`  ✅ Website Projects: ${u(websiteProj.id)}`);

  // ── 2. CLIENT PORTAL ──────────────────────────────────────────────────────
  log('Building 🔗 Client Portal...');
  const portal = await mkPage(IDS.clients, '🔗 Client Portal', '🔗');
  await addBlocks(portal.id, [
    callout('One-stop reference for all 10 active clients — SMM owner, services and key notes.', '🔗'),
    div(),
    h2("Tia's Clients"),
    toggle('Aarni by Sharavani — Social Media + Ads', [
      bul('Instagram: @aarnibysharavani'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Fine Jewellery'),
    ]),
    toggle('Bhagat Jewellers — Social Media', [
      bul('Instagram: @bhagatjewellers'),
      bul('Services: Social Media'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Gujranwala Jewellers — Social Media + Ads', [
      bul('Instagram: @gujranwalajewellers'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Vidhi Sheth — Social Media', [
      bul('Instagram: @vidhisheth'),
      bul('Services: Social Media'),
      bul('Industry: Fine Jewellery'),
    ]),
    toggle('Avani — Branding (in progress)', [
      bul('Instagram: @avani.jewels'),
      bul('Services: Branding'),
      bul('Note: Brand identity with Studio Ink. Due June 30.'),
    ]),
    div(),
    h2("Vanshika's Clients"),
    toggle('Atul Jewellers — Social Media + Ads + Branding', [
      bul('Instagram: @atuljewellers'),
      bul('Services: Social Media, Ads (Meta), Branding'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Beri Jewellers — Social Media + Ads', [
      bul('Instagram: @berijewellers'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Luminique — Social Media + Ads + Branding', [
      bul('Instagram: @luminique'),
      bul('Services: Social Media, Ads (Meta), Branding'),
      bul('Industry: Luxury'),
    ]),
    toggle('Karan Kothari Jewellers — Social Media + Ads', [
      bul('Instagram: @karankotharijewellers'),
      bul('Services: Social Media, Ads (Meta)'),
      bul('Industry: Jewellery'),
    ]),
    toggle('Elmara — Website (in progress)', [
      bul('Instagram: @elmara'),
      bul('Services: Website'),
      bul('Note: Website build with PixelCraft Studio. Due July 15.'),
    ]),
    div(),
    bul('→ Full Client Hub database', u(IDS.clientHub)),
  ]);
  log(`  ✅ Client Portal: ${u(portal.id)}`);

  // ── 3. ALL BRANDS ─────────────────────────────────────────────────────────
  log('Building 💎 All Brands...');
  const brands = await mkPage(IDS.clients, '💎 All Brands', '💎');
  await addBlocks(brands.id, [
    callout('Brand reference sheet — handles, niche and service scope for all 10 Gryd Co. clients.', '💎'),
    div(),
    h2('Jewellery'),
    bul('Aarni by Sharavani — Fine jewellery, solitaires  ·  @aarnibysharavani'),
    bul('Atul Jewellers — Traditional + bridal  ·  @atuljewellers'),
    bul('Bhagat Jewellers — Classic jewellery  ·  @bhagatjewellers'),
    bul('Beri Jewellers — Statement jewellery  ·  @berijewellers'),
    bul('Gujranwala Jewellers — Heritage jewellery  ·  @gujranwalajewellers'),
    bul('Vidhi Sheth — Contemporary fine jewellery  ·  @vidhisheth'),
    bul('Karan Kothari Jewellers — Premium jewellery  ·  @karankotharijewellers'),
    bul('Avani — Fine jewellery, branding phase  ·  @avani.jewels'),
    div(),
    h2('Luxury'),
    bul('Luminique — Luxury jewellery & lifestyle  ·  @luminique'),
    bul('Elmara — Luxury brand, website phase  ·  @elmara'),
    div(),
    bul('→ Client Hub database', u(IDS.clientHub)),
  ]);
  log(`  ✅ All Brands: ${u(brands.id)}`);

  console.log('\n══════════════════════════════════════════════════');
  console.log('   All pages created!');
  console.log('══════════════════════════════════════════════════');
  console.log(`\n🎨 Projects          → ${u(proj.id)}`);
  console.log(`   🖌️  Branding        → ${u(brandingProj.id)}`);
  console.log(`   🌐 Website         → ${u(websiteProj.id)}`);
  console.log(`🔗 Client Portal     → ${u(portal.id)}`);
  console.log(`💎 All Brands        → ${u(brands.id)}`);
  console.log('\n📌 Move to Grydco\'s HQ (right-click → Move to → Grydco\'s HQ):');
  console.log('   • 🏠 Founder Dashboard (already created earlier)');
  console.log('   • 🎨 Projects (just created)');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
