const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

const GETTING_STARTED = '37b6b847-91e8-8025-99c1-f6185bd0fda7';
const ADS_TRACKER     = '37b6b847-91e8-81bb-9922-c856c248ba7d';
const MONTHLY_REPORTS = '37b6b847-91e8-81b2-b76b-c4c7c46f13f0';

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
          headers: {
            'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28', 'Content-Length': Buffer.byteLength(data),
          },
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

const h2  = t => ({ type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: t } }] } });
const h3  = t => ({ type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: t } }] } });
const div = () => ({ type: 'divider', divider: {} });
const bul = (t, link) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: link ? { content: t, link: { url: link } } : { content: t } }] } });
const callout = (t, emoji) => ({ type: 'callout', callout: { rich_text: [{ type: 'text', text: { content: t } }], icon: { type: 'emoji', emoji } } });
const toggle = (t, children) => ({ type: 'toggle', toggle: { rich_text: [{ type: 'text', text: { content: t } }], children } });

async function main() {
  log('Creating 📊 Reporting & Performance Marketing page...');

  const report = await mkPage(GETTING_STARTED, '📊 Reporting & Performance Marketing', '📊');
  log(`  Page created: ${report.id}`);

  // First batch of blocks
  await addBlocks(report.id, [
    callout('Combined hub for ad campaign performance and monthly reporting across all Gryd Co. clients.', '📊'),
    div(),

    h2('📢 Performance Marketing — Ads Overview'),
    h3('Active Campaigns'),
    toggle('Aarni by Sharavani — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹15,000'),
      bul('Status: Active'),
      bul('Goal: Brand awareness + product reach'),
    ]),
    toggle('Gujranwala Jewellers — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹20,000'),
      bul('Status: Active'),
      bul('Goal: Sales + local reach'),
    ]),
    toggle('Atul Jewellers — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹25,000'),
      bul('Status: Active'),
      bul('Goal: Bridal season conversions'),
    ]),
    toggle('Beri Jewellers — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹18,000'),
      bul('Status: Active'),
      bul('Goal: Product awareness'),
    ]),
    toggle('Luminique — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹30,000'),
      bul('Status: Active'),
      bul('Goal: Luxury positioning + DMs'),
    ]),
    toggle('Karan Kothari Jewellers — Meta Ads', [
      bul('Platform: Meta (Facebook + Instagram)'),
      bul('Monthly Budget: ₹20,000'),
      bul('Status: Active'),
      bul('Goal: Lead generation'),
    ]),
    div(),
    bul('→ Full Ads Tracker database', u(ADS_TRACKER)),
    div(),
  ]);

  log('  First batch done, adding second batch...');

  // Second batch
  await addBlocks(report.id, [
    h2('📊 Monthly Reporting'),
    h3('June 2025 — Summary'),
    toggle('Aarni by Sharavani', [
      bul('Reach: 85,000  ·  Impressions: 1.2L  ·  Engagement Rate: 4.2%'),
      bul('Reels Views: 42,000  ·  Profile Visits: 3,100'),
      bul('Ad Spend: ₹15,000  ·  Link Clicks: 620'),
      bul('Highlight: Solitaire reel hit 18K views'),
    ]),
    toggle('Atul Jewellers', [
      bul('Reach: 1,10,000  ·  Impressions: 1.8L  ·  Engagement Rate: 3.8%'),
      bul('Reels Views: 65,000  ·  Profile Visits: 5,400'),
      bul('Ad Spend: ₹25,000  ·  Link Clicks: 980'),
      bul('Highlight: Bridal campaign drove highest CTR this month'),
    ]),
    toggle('Bhagat Jewellers', [
      bul('Reach: 48,000  ·  Impressions: 75,000  ·  Engagement Rate: 3.1%'),
      bul('Reels Views: 22,000  ·  Profile Visits: 1,800'),
      bul('Note: No ads running — organic only'),
    ]),
    toggle('Beri Jewellers', [
      bul('Reach: 60,000  ·  Impressions: 95,000  ·  Engagement Rate: 3.5%'),
      bul('Reels Views: 28,000  ·  Profile Visits: 2,200'),
      bul('Ad Spend: ₹18,000  ·  Link Clicks: 510'),
    ]),
    toggle('Gujranwala Jewellers', [
      bul('Reach: 72,000  ·  Impressions: 1.1L  ·  Engagement Rate: 3.9%'),
      bul('Reels Views: 35,000  ·  Profile Visits: 2,900'),
      bul('Ad Spend: ₹20,000  ·  Link Clicks: 740'),
    ]),
    toggle('Luminique', [
      bul('Reach: 95,000  ·  Impressions: 1.5L  ·  Engagement Rate: 4.8%'),
      bul('Reels Views: 58,000  ·  Profile Visits: 4,200'),
      bul('Ad Spend: ₹30,000  ·  Link Clicks: 860'),
      bul('Highlight: Luxury lifestyle reel 30K views, highest ROAS this month'),
    ]),
    toggle('Vidhi Sheth', [
      bul('Reach: 38,000  ·  Impressions: 58,000  ·  Engagement Rate: 4.0%'),
      bul('Reels Views: 18,000  ·  Profile Visits: 1,500'),
      bul('Note: No ads running — organic only'),
    ]),
    toggle('Karan Kothari Jewellers', [
      bul('Reach: 55,000  ·  Impressions: 82,000  ·  Engagement Rate: 3.3%'),
      bul('Reels Views: 24,000  ·  Profile Visits: 2,000'),
      bul('Ad Spend: ₹20,000  ·  Link Clicks: 590'),
    ]),
    div(),
    bul('→ Full Monthly Reports database', u(MONTHLY_REPORTS)),
    div(),
    h2('📌 How to Use This Section'),
    bul('Open Ads Tracker to add/edit campaigns, budgets, and results'),
    bul('Open Monthly Reports to log each client\'s monthly numbers'),
    bul('Use filters: Client Name, Month, Platform to slice data'),
    bul('Share monthly report page links directly with clients if needed'),
  ]);

  log('  ✅ All blocks added!');

  console.log('\n══════════════════════════════════════════════════════');
  console.log('   📊 Reporting & Performance Marketing page DONE!');
  console.log('══════════════════════════════════════════════════════');
  console.log(`\n📊 New Reporting page → ${u(report.id)}`);
  console.log('\n📌 NEXT STEPS:');
  console.log('   1. Open Notion — find "📊 Reporting & Performance Marketing" under Getting Started');
  console.log('   2. Delete (or archive) the OLD empty "📊 Reporting" page');
  console.log('   3. Right-click the new page → Move to → Grydco\'s HQ');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
