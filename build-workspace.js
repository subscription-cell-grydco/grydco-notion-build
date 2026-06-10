const https = require('https');

const TOKEN = process.env.NOTION_TOKEN;
const PARENT_ID = process.env.NOTION_PARENT_ID;

if (!TOKEN) {
  console.error('Set NOTION_TOKEN first:  set NOTION_TOKEN=ntn_xxx');
  process.exit(1);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = https.request({
      hostname: 'api.notion.com',
      path: `/v1/${path}`,
      method,
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
        const parsed = JSON.parse(raw);
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(Object.assign(new Error(parsed.message || raw), { status: res.statusCode, body: parsed }));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

// ─── Find parent page ─────────────────────────────────────────────────────────

async function findParent() {
  if (PARENT_ID) { log(`Using supplied parent: ${PARENT_ID}`); return PARENT_ID; }
  const res = await api('POST', 'search', { filter: { value: 'page', property: 'object' }, page_size: 10 });
  const page = res.results.find(r => r.object === 'page');
  if (page) { log(`Found page: ${page.id}`); return page.id; }
  throw new Error('No accessible pages found. Set NOTION_PARENT_ID and re-run.');
}

// ─── Page / database creators ─────────────────────────────────────────────────

function createPage(parentId, title, emoji) {
  return api('POST', 'pages', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji },
    properties: { title: { title: [{ text: { content: title } }] } },
  });
}

function createDatabase(parentId, title, emoji, properties) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji },
    title: [{ type: 'text', text: { content: title } }],
    properties,
  });
}

function addRow(dbId, properties) {
  return api('POST', 'pages', { parent: { type: 'database_id', database_id: dbId }, properties });
}

// ─── Database schemas ─────────────────────────────────────────────────────────

const schemas = {
  clientHub: {
    'Client Name':          { title: {} },
    'Industry':             { select: { options: [{ name: 'Jewellery', color: 'yellow' }, { name: 'Fine Jewellery', color: 'pink' }, { name: 'Luxury', color: 'purple' }] } },
    'SMM Assigned':         { rich_text: {} },
    'Status':               { select: { options: [{ name: 'Active', color: 'green' }, { name: 'On Hold', color: 'yellow' }, { name: 'Offboarded', color: 'red' }] } },
    'Services':             { multi_select: { options: [{ name: 'Social Media', color: 'blue' }, { name: 'Ads', color: 'orange' }, { name: 'Branding', color: 'pink' }, { name: 'Website', color: 'purple' }] } },
    'Contract Start Date':  { date: {} },
    'Monthly Budget':       { number: { format: 'rupee' } },
    'Instagram Handle':     { rich_text: {} },
    'Onboarding Form Link': { url: {} },
  },
  workflowTracker: {
    'Task Name':  { title: {} },
    'Client':     { rich_text: {} },
    'Owner':      { rich_text: {} },
    'Status':     { select: { options: [{ name: 'Not Started', color: 'gray' }, { name: 'In Progress', color: 'blue' }, { name: 'Review', color: 'yellow' }, { name: 'Done', color: 'green' }, { name: 'Blocked', color: 'red' }] } },
    'Due Date':   { date: {} },
    'Priority':   { select: { options: [{ name: 'High', color: 'red' }, { name: 'Medium', color: 'yellow' }, { name: 'Low', color: 'green' }] } },
    'Task Type':  { select: { options: [{ name: 'Strategy', color: 'purple' }, { name: 'Brief', color: 'blue' }, { name: 'Design', color: 'pink' }, { name: 'Approval', color: 'orange' }, { name: 'Reporting', color: 'gray' }, { name: 'Admin', color: 'brown' }, { name: 'Ads', color: 'yellow' }] } },
    'Day':        { select: { options: [{ name: 'Monday', color: 'blue' }, { name: 'Tuesday', color: 'green' }, { name: 'Wednesday', color: 'yellow' }, { name: 'Thursday', color: 'orange' }, { name: 'Friday', color: 'pink' }] } },
  },
  contentCalendar: {
    'Post Title':           { title: {} },
    'Client':               { rich_text: {} },
    'Platform':             { select: { options: [{ name: 'Instagram Post', color: 'pink' }, { name: 'Reel', color: 'purple' }, { name: 'Story', color: 'blue' }, { name: 'Carousel', color: 'orange' }, { name: 'LinkedIn', color: 'blue' }] } },
    'Post Date':            { date: {} },
    'Status':               { select: { options: [{ name: 'Brief Pending', color: 'gray' }, { name: 'In Design', color: 'blue' }, { name: 'Designed', color: 'yellow' }, { name: 'Approved', color: 'green' }, { name: 'Scheduled', color: 'purple' }, { name: 'Posted', color: 'green' }] } },
    'Assigned SMM':         { rich_text: {} },
    'Post Type':            { select: { options: [{ name: 'Reel', color: 'purple' }, { name: 'Post', color: 'pink' }, { name: 'Carousel', color: 'orange' }, { name: 'Story', color: 'blue' }] } },
    'Intent':               { rich_text: {} },
    'Hook/Objective':       { rich_text: {} },
    'Image Copy':           { rich_text: {} },
    'Collection':           { rich_text: {} },
    'Brief/Reference Link': { url: {} },
    'Drive Link':           { url: {} },
    'Caption Ready':        { checkbox: {} },
    'Visual Ready':         { checkbox: {} },
  },
  approvalLog: {
    'Item Name':      { title: {} },
    'Client':         { rich_text: {} },
    'Type':           { select: { options: [{ name: 'Content Batch', color: 'blue' }, { name: 'Single Post', color: 'green' }, { name: 'Branding', color: 'pink' }, { name: 'Report', color: 'yellow' }, { name: 'Website', color: 'purple' }] } },
    'Approval Round': { number: {} },
    'SMM Status':     { select: { options: [{ name: 'Pending', color: 'gray' }, { name: 'Submitted', color: 'green' }] } },
    'TL Status':      { select: { options: [{ name: 'Pending', color: 'gray' }, { name: 'Approved', color: 'green' }, { name: 'Revision Needed', color: 'red' }] } },
    'Client Status':  { select: { options: [{ name: 'Pending', color: 'gray' }, { name: 'Approved', color: 'green' }, { name: 'Revision Needed', color: 'red' }] } },
    'Feedback Notes': { rich_text: {} },
    'Date Submitted': { date: {} },
  },
  revisionLog: {
    'Item Name':      { title: {} },
    'Client':         { rich_text: {} },
    'Revision Type':  { select: { options: [{ name: 'Minor', color: 'green' }, { name: 'Moderate', color: 'yellow' }, { name: 'Major', color: 'red' }] } },
    'Revision Count': { number: {} },
    'Owner':          { rich_text: {} },
    'Status':         { select: { options: [{ name: 'Pending', color: 'gray' }, { name: 'In Progress', color: 'blue' }, { name: 'Resolved', color: 'green' }] } },
    'Delay Impact':   { select: { options: [{ name: 'None', color: 'green' }, { name: 'Slight', color: 'yellow' }, { name: 'Significant', color: 'red' }] } },
    'Notes':          { rich_text: {} },
    'Date Raised':    { date: {} },
  },
  adsTracker: {
    'Campaign Name':     { title: {} },
    'Client':            { rich_text: {} },
    'Platform':          { select: { options: [{ name: 'Meta', color: 'blue' }, { name: 'Google', color: 'green' }, { name: 'Pinterest', color: 'red' }, { name: 'Other', color: 'gray' }] } },
    'Ad Type':           { select: { options: [{ name: 'Static', color: 'gray' }, { name: 'Video', color: 'purple' }, { name: 'Carousel', color: 'orange' }, { name: 'Story', color: 'blue' }, { name: 'Search', color: 'green' }, { name: 'Display', color: 'yellow' }] } },
    'Go Live Date':      { date: {} },
    'Status':            { select: { options: [{ name: 'Draft', color: 'gray' }, { name: 'In Review', color: 'yellow' }, { name: 'Live', color: 'green' }, { name: 'Paused', color: 'orange' }, { name: 'Ended', color: 'red' }] } },
    'Budget':            { number: { format: 'rupee' } },
    'Amount Spent':      { number: { format: 'rupee' } },
    'Managed By':        { rich_text: {} },
    'Performance Notes': { rich_text: {} },
    'Last Updated':      { date: {} },
  },
  projectsTracker: {
    'Project Name':   { title: {} },
    'Client':         { rich_text: {} },
    'Project Type':   { select: { options: [{ name: 'Photo Shoot', color: 'pink' }, { name: 'Branding', color: 'purple' }, { name: 'Website', color: 'blue' }] } },
    'Vendor Name':    { rich_text: {} },
    'Status':         { select: { options: [{ name: 'Not Started', color: 'gray' }, { name: 'Briefed', color: 'blue' }, { name: 'In Progress', color: 'yellow' }, { name: 'Review', color: 'orange' }, { name: 'Delivered', color: 'purple' }, { name: 'Live', color: 'green' }] } },
    'Scheduled Date': { date: {} },
    'Delivery Date':  { date: {} },
    'Internal Owner': { rich_text: {} },
    'Vendor Contact': { rich_text: {} },
    'Notes':          { rich_text: {} },
  },
  monthlyReports: {
    'Report Title':     { title: {} },
    'Client':           { rich_text: {} },
    'Report Month':     { date: {} },
    'Status':           { select: { options: [{ name: 'Draft', color: 'gray' }, { name: 'In Review', color: 'yellow' }, { name: 'Sent to Client', color: 'green' }] } },
    'SMM Assigned':     { rich_text: {} },
    'Key Metrics':      { rich_text: {} },
    'Reach':            { rich_text: {} },
    'Engagement Rate':  { rich_text: {} },
    'New Followers':    { rich_text: {} },
    'Report Link':      { url: {} },
    'Excel Report Link':{ url: {} },
  },
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function rt(text)    { return { rich_text: [{ text: { content: text } }] }; }
function sel(name)   { return { select: { name } }; }
function msel(arr)   { return { multi_select: arr.map(n => ({ name: n })) }; }
function dt(start)   { return { date: { start } }; }
function num(n)      { return { number: n }; }
function chk(b)      { return { checkbox: b }; }
function ttl(text)   { return { title: [{ text: { content: text } }] }; }

const clients = [
  { name: 'Aarni by Sharavani',       industry: 'Fine Jewellery', smm: 'Tia',      services: ['Social Media', 'Ads'],            handle: '@aarnibysharavani' },
  { name: 'Atul Jewellers',            industry: 'Jewellery',      smm: 'Vanshika', services: ['Social Media', 'Ads', 'Branding'], handle: '@atuljewellers' },
  { name: 'Bhagat Jewellers',          industry: 'Jewellery',      smm: 'Tia',      services: ['Social Media'],                   handle: '@bhagatjewellers' },
  { name: 'Beri Jewellers',            industry: 'Jewellery',      smm: 'Vanshika', services: ['Social Media', 'Ads'],            handle: '@berijewellers' },
  { name: 'Gujranwala Jewellers',      industry: 'Jewellery',      smm: 'Tia',      services: ['Social Media', 'Ads'],            handle: '@gujranwalajewellers' },
  { name: 'Luminique',                 industry: 'Luxury',         smm: 'Vanshika', services: ['Social Media', 'Ads', 'Branding'], handle: '@luminique' },
  { name: 'Vidhi Sheth',               industry: 'Fine Jewellery', smm: 'Tia',      services: ['Social Media'],                   handle: '@vidhisheth' },
  { name: 'Karan Kothari Jewellers',   industry: 'Jewellery',      smm: 'Vanshika', services: ['Social Media', 'Ads'],            handle: '@karankotharijewellers' },
  { name: 'Avani',                     industry: 'Fine Jewellery', smm: 'Tia',      services: ['Branding'],                       handle: '@avani.jewels' },
  { name: 'Elmara',                    industry: 'Luxury',         smm: 'Vanshika', services: ['Website'],                        handle: '@elmara' },
];

const tasks = [
  { name: 'June Content Strategy — Aarni',        client: 'Aarni by Sharavani',   owner: 'Tia',       status: 'In Progress', due: '2026-06-12', priority: 'High',   type: 'Strategy',  day: 'Monday' },
  { name: 'Design Reel Covers — Luminique',        client: 'Luminique',            owner: 'Mahima',    status: 'Not Started', due: '2026-06-13', priority: 'High',   type: 'Design',    day: 'Tuesday' },
  { name: 'Meta Ads Setup — Beri Jewellers',       client: 'Beri Jewellers',       owner: 'Pratyusha', status: 'In Progress', due: '2026-06-14', priority: 'High',   type: 'Ads',       day: 'Wednesday' },
  { name: 'Monthly Report Review — Atul',          client: 'Atul Jewellers',       owner: 'Manika',    status: 'Review',      due: '2026-06-15', priority: 'Medium', type: 'Reporting', day: 'Thursday' },
  { name: 'Client Approval — Gujranwala Batch 2',  client: 'Gujranwala Jewellers', owner: 'Tia',       status: 'Not Started', due: '2026-06-16', priority: 'Medium', type: 'Approval',  day: 'Friday' },
];

const posts = [
  { title: 'Solitaire Reel — Aarni June Week 1',    client: 'Aarni by Sharavani', platform: 'Reel',          date: '2026-06-11', status: 'In Design',     smm: 'Tia',      type: 'Reel',     intent: 'Awareness',  hook: 'Show the sparkle of our new solitaire line',    copy: 'Timeless. Brilliant. Yours.',                         collection: 'Solitaire 2024', visual: false },
  { title: 'Bridal Carousel — Atul Jewellers',       client: 'Atul Jewellers',     platform: 'Carousel',      date: '2026-06-12', status: 'Approved',      smm: 'Vanshika', type: 'Carousel', intent: 'Conversion', hook: 'Bridal season — showcase full wedding sets',    copy: 'Your dream bridal look starts here.',                 collection: 'Bridal 2024',    visual: true  },
  { title: 'Behind the Scenes Story — Bhagat',       client: 'Bhagat Jewellers',   platform: 'Story',         date: '2026-06-13', status: 'Brief Pending', smm: 'Tia',      type: 'Story',    intent: 'Engagement', hook: 'Show craftsmanship process',                    copy: 'Crafted with love, worn with pride.',                 collection: 'Artisan Series', visual: false },
  { title: 'New Collection Drop — Luminique',        client: 'Luminique',          platform: 'Instagram Post', date: '2026-06-14', status: 'Scheduled',    smm: 'Vanshika', type: 'Post',     intent: 'Launch',     hook: 'Announce SS26 luxury collection',               copy: 'Introducing the SS26 Edit — where luxury meets light.', collection: 'SS26',         visual: true  },
  { title: 'Product Highlight Reel — Vidhi Sheth',   client: 'Vidhi Sheth',        platform: 'Reel',          date: '2026-06-15', status: 'Designed',      smm: 'Tia',      type: 'Reel',     intent: 'Awareness',  hook: 'Highlight signature pieces with close-up shots', copy: 'Everyday elegance, elevated.',                       collection: 'Signature Edit', visual: true  },
];

const approvals = [
  { name: 'Aarni June Week 1 Batch',     client: 'Aarni by Sharavani', type: 'Content Batch', round: 1, smm: 'Submitted', tl: 'Approved',        client_s: 'Pending',         feedback: 'TL approved. Awaiting client sign-off.',                       date: '2026-06-09' },
  { name: 'Luminique SS26 Launch',       client: 'Luminique',          type: 'Content Batch', round: 2, smm: 'Submitted', tl: 'Revision Needed', client_s: 'Pending',         feedback: 'Caption tone needs refinement — too formal.',                   date: '2026-06-08' },
  { name: 'Atul Branding Deck Round 1',  client: 'Atul Jewellers',     type: 'Branding',      round: 1, smm: 'Submitted', tl: 'Approved',        client_s: 'Revision Needed', feedback: 'Client requested colour palette change to warmer tones.',       date: '2026-06-07' },
];

const ads = [
  { name: 'Aarni — Awareness June 2026',     client: 'Aarni by Sharavani',   platform: 'Meta', type: 'Video',   live: '2026-06-10', status: 'Live',   budget: 25000, spent: 8200,  manager: 'Pratyusha', notes: 'CPM ₹45, CTR 2.3% — performing above benchmark.' },
  { name: 'Beri — Conversion Campaign Q2',   client: 'Beri Jewellers',       platform: 'Meta', type: 'Carousel', live: '2026-06-01', status: 'Live',  budget: 40000, spent: 21000, manager: 'Pratyusha', notes: 'ROAS 4.1x. Carousel format outperforming static.' },
  { name: 'Gujranwala — Bridal Season Ads',  client: 'Gujranwala Jewellers', platform: 'Meta', type: 'Static',  live: '2026-05-20', status: 'Paused', budget: 30000, spent: 29500, manager: 'Pratyusha', notes: 'Budget nearly exhausted. Paused pending renewal.' },
];

const projects = [
  { name: 'Avani Brand Identity',   client: 'Avani',          type: 'Branding',    vendor: 'Studio Ink',              status: 'In Progress', sched: '2026-05-15', del: '2026-06-30', owner: 'Manika', contact: '+91 98100 11111', notes: 'Logo + brand kit underway. Final delivery end of June.' },
  { name: 'Elmara Website Build',   client: 'Elmara',         type: 'Website',     vendor: 'PixelCraft Studio',        status: 'Briefed',     sched: '2026-06-05', del: '2026-07-15', owner: 'Manika', contact: '+91 98100 22222', notes: 'Wireframes shared. Dev handoff next week.' },
  { name: 'Atul Q2 Product Shoot',  client: 'Atul Jewellers', type: 'Photo Shoot', vendor: 'Lens & Light Photography', status: 'Delivered',   sched: '2026-05-28', del: '2026-06-06', owner: 'Tia',    contact: '+91 98100 33333', notes: 'All images received and sorted in Drive. Ready for scheduling.' },
];

const reports = [
  { title: 'Aarni — May 2026 Monthly Report',     client: 'Aarni by Sharavani', month: '2026-05-01', status: 'Sent to Client', smm: 'Tia',      metrics: 'Reach: 48K | Engagement: 5.2% | Followers: +312', reach: '48,000', eng: '5.2%', followers: '312' },
  { title: 'Luminique — May 2026 Monthly Report', client: 'Luminique',          month: '2026-05-01', status: 'In Review',      smm: 'Vanshika', metrics: 'Reach: 72K | Engagement: 6.8% | Followers: +520', reach: '72,000', eng: '6.8%', followers: '520' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Starting Gryd Co. Notion workspace build...');

  const parentId = await findParent();

  // Step 1 — top-level pages
  log('STEP 1: Creating top-level pages...');
  const clientsPage   = await createPage(parentId, 'Clients',    '🏢'); log(`  Clients    → ${clientsPage.id}`);
  const opsPage       = await createPage(parentId, 'Operations', '⚙️'); log(`  Operations → ${opsPage.id}`);
  const reportingPage = await createPage(parentId, 'Reporting',  '📊'); log(`  Reporting  → ${reportingPage.id}`);

  // Step 2 — databases
  log('STEP 2: Creating 8 databases...');
  const dbs = {};
  dbs.clientHub     = await createDatabase(clientsPage.id,   'Client Hub',        '💎', schemas.clientHub);     log('  ✅ Client Hub');
  dbs.workflow      = await createDatabase(opsPage.id,       'Workflow Tracker',  '📋', schemas.workflowTracker); log('  ✅ Workflow Tracker');
  dbs.calendar      = await createDatabase(opsPage.id,       'Content Calendar',  '📅', schemas.contentCalendar); log('  ✅ Content Calendar');
  dbs.approval      = await createDatabase(opsPage.id,       'Approval Log',      '✅', schemas.approvalLog);    log('  ✅ Approval Log');
  dbs.revision      = await createDatabase(opsPage.id,       'Revision Log',      '🔄', schemas.revisionLog);    log('  ✅ Revision Log');
  dbs.ads           = await createDatabase(opsPage.id,       'Ads Tracker',       '📣', schemas.adsTracker);     log('  ✅ Ads Tracker');
  dbs.projects      = await createDatabase(opsPage.id,       'Projects Tracker',  '🚀', schemas.projectsTracker); log('  ✅ Projects Tracker');
  dbs.reports       = await createDatabase(reportingPage.id, 'Monthly Reports',   '📊', schemas.monthlyReports); log('  ✅ Monthly Reports');

  // Step 3 — 10 clients
  log('STEP 3: Adding 10 clients...');
  for (const c of clients) {
    await addRow(dbs.clientHub.id, { 'Client Name': ttl(c.name), 'Industry': sel(c.industry), 'SMM Assigned': rt(c.smm), 'Status': sel('Active'), 'Services': msel(c.services), 'Instagram Handle': rt(c.handle), 'Contract Start Date': dt('2024-01-01') });
    log(`  → ${c.name}`);
  }

  // Step 4 — sample data
  log('STEP 4: Adding sample data...');

  for (const t of tasks) {
    await addRow(dbs.workflow.id, { 'Task Name': ttl(t.name), 'Client': rt(t.client), 'Owner': rt(t.owner), 'Status': sel(t.status), 'Due Date': dt(t.due), 'Priority': sel(t.priority), 'Task Type': sel(t.type), 'Day': sel(t.day) });
    log(`  → Task: ${t.name}`);
  }

  for (const p of posts) {
    await addRow(dbs.calendar.id, { 'Post Title': ttl(p.title), 'Client': rt(p.client), 'Platform': sel(p.platform), 'Post Date': dt(p.date), 'Status': sel(p.status), 'Assigned SMM': rt(p.smm), 'Post Type': sel(p.type), 'Intent': rt(p.intent), 'Hook/Objective': rt(p.hook), 'Image Copy': rt(p.copy), 'Collection': rt(p.collection), 'Caption Ready': chk(false), 'Visual Ready': chk(p.visual) });
    log(`  → Post: ${p.title}`);
  }

  for (const a of approvals) {
    await addRow(dbs.approval.id, { 'Item Name': ttl(a.name), 'Client': rt(a.client), 'Type': sel(a.type), 'Approval Round': num(a.round), 'SMM Status': sel(a.smm), 'TL Status': sel(a.tl), 'Client Status': sel(a.client_s), 'Feedback Notes': rt(a.feedback), 'Date Submitted': dt(a.date) });
    log(`  → Approval: ${a.name}`);
  }

  for (const a of ads) {
    await addRow(dbs.ads.id, { 'Campaign Name': ttl(a.name), 'Client': rt(a.client), 'Platform': sel(a.platform), 'Ad Type': sel(a.type), 'Go Live Date': dt(a.live), 'Status': sel(a.status), 'Budget': num(a.budget), 'Amount Spent': num(a.spent), 'Managed By': rt(a.manager), 'Performance Notes': rt(a.notes), 'Last Updated': dt('2026-06-10') });
    log(`  → Ad: ${a.name}`);
  }

  for (const p of projects) {
    await addRow(dbs.projects.id, { 'Project Name': ttl(p.name), 'Client': rt(p.client), 'Project Type': sel(p.type), 'Vendor Name': rt(p.vendor), 'Status': sel(p.status), 'Scheduled Date': dt(p.sched), 'Delivery Date': dt(p.del), 'Internal Owner': rt(p.owner), 'Vendor Contact': rt(p.contact), 'Notes': rt(p.notes) });
    log(`  → Project: ${p.name}`);
  }

  for (const r of reports) {
    await addRow(dbs.reports.id, { 'Report Title': ttl(r.title), 'Client': rt(r.client), 'Report Month': dt(r.month), 'Status': sel(r.status), 'SMM Assigned': rt(r.smm), 'Key Metrics': rt(r.metrics), 'Reach': rt(r.reach), 'Engagement Rate': rt(r.eng), 'New Followers': rt(r.followers) });
    log(`  → Report: ${r.title}`);
  }

  const url = id => `https://www.notion.so/${id.replace(/-/g, '')}`;
  console.log('\n════════════════════════════════════════════');
  console.log('   Gryd Co. Notion workspace COMPLETE!');
  console.log('════════════════════════════════════════════');
  console.log(`\n Pages:`);
  console.log(`   Clients    → ${url(clientsPage.id)}`);
  console.log(`   Operations → ${url(opsPage.id)}`);
  console.log(`   Reporting  → ${url(reportingPage.id)}`);
  console.log(`\n Databases:`);
  Object.entries({ 'Client Hub': dbs.clientHub, 'Workflow Tracker': dbs.workflow, 'Content Calendar': dbs.calendar, 'Approval Log': dbs.approval, 'Revision Log': dbs.revision, 'Ads Tracker': dbs.ads, 'Projects Tracker': dbs.projects, 'Monthly Reports': dbs.reports })
    .forEach(([name, db]) => console.log(`   ${name.padEnd(20)} → ${url(db.id)}`));
}

main().catch(err => {
  console.error('\nError:', err.message);
  if (err.body) console.error('Detail:', JSON.stringify(err.body));
  process.exit(1);
});
