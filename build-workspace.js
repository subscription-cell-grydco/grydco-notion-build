const { Client } = require('@notionhq/client');

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error('❌ Set the NOTION_TOKEN environment variable before running.');
  console.error('   Example: NOTION_TOKEN=ntn_xxx node build-workspace.js');
  process.exit(1);
}

const notion = new Client({ auth: token });

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function createPage(parentId, title, emoji) {
  return notion.pages.create({
    parent: parentId ? { page_id: parentId } : { type: 'workspace', workspace: true },
    icon: { type: 'emoji', emoji },
    properties: {
      title: { title: [{ text: { content: title } }] },
    },
  });
}

async function createTopLevelPage(title, emoji) {
  return notion.pages.create({
    parent: { type: 'workspace', workspace: true },
    icon: { type: 'emoji', emoji },
    properties: {
      title: { title: [{ text: { content: title } }] },
    },
  });
}

// ─── DATABASE CREATORS ────────────────────────────────────────────────────────

async function createClientHub(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '💎' },
    title: [{ text: { content: 'Client Hub' } }],
    properties: {
      'Client Name':       { title: {} },
      'Industry':          { select: { options: [
        { name: 'Jewellery',      color: 'yellow' },
        { name: 'Fine Jewellery', color: 'pink' },
        { name: 'Luxury',         color: 'purple' },
      ]}},
      'SMM Assigned':      { rich_text: {} },
      'Status':            { select: { options: [
        { name: 'Active',      color: 'green' },
        { name: 'On Hold',     color: 'yellow' },
        { name: 'Offboarded',  color: 'red' },
      ]}},
      'Services':          { multi_select: { options: [
        { name: 'Social Media', color: 'blue' },
        { name: 'Ads',          color: 'orange' },
        { name: 'Branding',     color: 'pink' },
        { name: 'Website',      color: 'purple' },
      ]}},
      'Contract Start Date': { date: {} },
      'Monthly Budget':    { number: { format: 'rupee' } },
      'Instagram Handle':  { rich_text: {} },
      'Onboarding Form Link': { url: {} },
    },
  });
  log(`✅ Created database: Client Hub (${db.id})`);
  return db;
}

async function createWorkflowTracker(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '📋' },
    title: [{ text: { content: 'Workflow Tracker' } }],
    properties: {
      'Task Name':  { title: {} },
      'Client':     { rich_text: {} },
      'Owner':      { rich_text: {} },
      'Status':     { select: { options: [
        { name: 'Not Started', color: 'gray' },
        { name: 'In Progress', color: 'blue' },
        { name: 'Review',      color: 'yellow' },
        { name: 'Done',        color: 'green' },
        { name: 'Blocked',     color: 'red' },
      ]}},
      'Due Date':   { date: {} },
      'Priority':   { select: { options: [
        { name: 'High',   color: 'red' },
        { name: 'Medium', color: 'yellow' },
        { name: 'Low',    color: 'green' },
      ]}},
      'Task Type':  { select: { options: [
        { name: 'Strategy',  color: 'purple' },
        { name: 'Brief',     color: 'blue' },
        { name: 'Design',    color: 'pink' },
        { name: 'Approval',  color: 'orange' },
        { name: 'Reporting', color: 'gray' },
        { name: 'Admin',     color: 'brown' },
        { name: 'Ads',       color: 'yellow' },
      ]}},
      'Day':        { select: { options: [
        { name: 'Monday',    color: 'blue' },
        { name: 'Tuesday',   color: 'green' },
        { name: 'Wednesday', color: 'yellow' },
        { name: 'Thursday',  color: 'orange' },
        { name: 'Friday',    color: 'pink' },
      ]}},
    },
  });
  log(`✅ Created database: Workflow Tracker (${db.id})`);
  return db;
}

async function createContentCalendar(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '📅' },
    title: [{ text: { content: 'Content Calendar' } }],
    properties: {
      'Post Title':       { title: {} },
      'Client':           { rich_text: {} },
      'Platform':         { select: { options: [
        { name: 'Instagram Post',     color: 'pink' },
        { name: 'Reel',               color: 'purple' },
        { name: 'Story',              color: 'blue' },
        { name: 'Carousel',           color: 'orange' },
        { name: 'LinkedIn',           color: 'blue' },
      ]}},
      'Post Date':        { date: {} },
      'Status':           { select: { options: [
        { name: 'Brief Pending', color: 'gray' },
        { name: 'In Design',     color: 'blue' },
        { name: 'Designed',      color: 'yellow' },
        { name: 'Approved',      color: 'green' },
        { name: 'Scheduled',     color: 'purple' },
        { name: 'Posted',        color: 'green' },
      ]}},
      'Assigned SMM':     { rich_text: {} },
      'Post Type':        { select: { options: [
        { name: 'Reel',     color: 'purple' },
        { name: 'Post',     color: 'pink' },
        { name: 'Carousel', color: 'orange' },
        { name: 'Story',    color: 'blue' },
      ]}},
      'Intent':           { rich_text: {} },
      'Hook/Objective':   { rich_text: {} },
      'Image Copy':       { rich_text: {} },
      'Collection':       { rich_text: {} },
      'Brief/Reference Link': { url: {} },
      'Drive Link':       { url: {} },
      'Caption Ready':    { checkbox: {} },
      'Visual Ready':     { checkbox: {} },
    },
  });
  log(`✅ Created database: Content Calendar (${db.id})`);
  return db;
}

async function createApprovalLog(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '✅' },
    title: [{ text: { content: 'Approval Log' } }],
    properties: {
      'Item Name':      { title: {} },
      'Client':         { rich_text: {} },
      'Type':           { select: { options: [
        { name: 'Content Batch', color: 'blue' },
        { name: 'Single Post',   color: 'green' },
        { name: 'Branding',      color: 'pink' },
        { name: 'Report',        color: 'yellow' },
        { name: 'Website',       color: 'purple' },
      ]}},
      'Approval Round': { number: {} },
      'SMM Status':     { select: { options: [
        { name: 'Pending',   color: 'gray' },
        { name: 'Submitted', color: 'green' },
      ]}},
      'TL Status':      { select: { options: [
        { name: 'Pending',          color: 'gray' },
        { name: 'Approved',         color: 'green' },
        { name: 'Revision Needed',  color: 'red' },
      ]}},
      'Client Status':  { select: { options: [
        { name: 'Pending',          color: 'gray' },
        { name: 'Approved',         color: 'green' },
        { name: 'Revision Needed',  color: 'red' },
      ]}},
      'Feedback Notes': { rich_text: {} },
      'Date Submitted': { date: {} },
    },
  });
  log(`✅ Created database: Approval Log (${db.id})`);
  return db;
}

async function createRevisionLog(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '🔄' },
    title: [{ text: { content: 'Revision Log' } }],
    properties: {
      'Item Name':     { title: {} },
      'Client':        { rich_text: {} },
      'Revision Type': { select: { options: [
        { name: 'Minor',    color: 'green' },
        { name: 'Moderate', color: 'yellow' },
        { name: 'Major',    color: 'red' },
      ]}},
      'Revision Count': { number: {} },
      'Owner':         { rich_text: {} },
      'Status':        { select: { options: [
        { name: 'Pending',     color: 'gray' },
        { name: 'In Progress', color: 'blue' },
        { name: 'Resolved',    color: 'green' },
      ]}},
      'Delay Impact':  { select: { options: [
        { name: 'None',        color: 'green' },
        { name: 'Slight',      color: 'yellow' },
        { name: 'Significant', color: 'red' },
      ]}},
      'Notes':         { rich_text: {} },
      'Date Raised':   { date: {} },
    },
  });
  log(`✅ Created database: Revision Log (${db.id})`);
  return db;
}

async function createAdsTracker(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '📣' },
    title: [{ text: { content: 'Ads Tracker' } }],
    properties: {
      'Campaign Name':    { title: {} },
      'Client':           { rich_text: {} },
      'Platform':         { select: { options: [
        { name: 'Meta',      color: 'blue' },
        { name: 'Google',    color: 'green' },
        { name: 'Pinterest', color: 'red' },
        { name: 'Other',     color: 'gray' },
      ]}},
      'Ad Type':          { select: { options: [
        { name: 'Static',   color: 'gray' },
        { name: 'Video',    color: 'purple' },
        { name: 'Carousel', color: 'orange' },
        { name: 'Story',    color: 'blue' },
        { name: 'Search',   color: 'green' },
        { name: 'Display',  color: 'yellow' },
      ]}},
      'Go Live Date':     { date: {} },
      'Status':           { select: { options: [
        { name: 'Draft',      color: 'gray' },
        { name: 'In Review',  color: 'yellow' },
        { name: 'Live',       color: 'green' },
        { name: 'Paused',     color: 'orange' },
        { name: 'Ended',      color: 'red' },
      ]}},
      'Budget':           { number: { format: 'rupee' } },
      'Amount Spent':     { number: { format: 'rupee' } },
      'Managed By':       { rich_text: {} },
      'Performance Notes': { rich_text: {} },
      'Last Updated':     { date: {} },
    },
  });
  log(`✅ Created database: Ads Tracker (${db.id})`);
  return db;
}

async function createProjectsTracker(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '🚀' },
    title: [{ text: { content: 'Projects Tracker' } }],
    properties: {
      'Project Name':    { title: {} },
      'Client':          { rich_text: {} },
      'Project Type':    { select: { options: [
        { name: 'Photo Shoot', color: 'pink' },
        { name: 'Branding',    color: 'purple' },
        { name: 'Website',     color: 'blue' },
      ]}},
      'Vendor Name':     { rich_text: {} },
      'Status':          { select: { options: [
        { name: 'Not Started', color: 'gray' },
        { name: 'Briefed',     color: 'blue' },
        { name: 'In Progress', color: 'yellow' },
        { name: 'Review',      color: 'orange' },
        { name: 'Delivered',   color: 'purple' },
        { name: 'Live',        color: 'green' },
      ]}},
      'Scheduled Date':  { date: {} },
      'Delivery Date':   { date: {} },
      'Internal Owner':  { rich_text: {} },
      'Vendor Contact':  { rich_text: {} },
      'Notes':           { rich_text: {} },
    },
  });
  log(`✅ Created database: Projects Tracker (${db.id})`);
  return db;
}

async function createMonthlyReports(parentId) {
  const db = await notion.databases.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '📊' },
    title: [{ text: { content: 'Monthly Reports' } }],
    properties: {
      'Report Title':     { title: {} },
      'Client':           { rich_text: {} },
      'Report Month':     { date: {} },
      'Status':           { select: { options: [
        { name: 'Draft',           color: 'gray' },
        { name: 'In Review',       color: 'yellow' },
        { name: 'Sent to Client',  color: 'green' },
      ]}},
      'SMM Assigned':     { rich_text: {} },
      'Key Metrics':      { rich_text: {} },
      'Reach':            { rich_text: {} },
      'Engagement Rate':  { rich_text: {} },
      'New Followers':    { rich_text: {} },
      'Report Link':      { url: {} },
      'Excel Report Link': { url: {} },
    },
  });
  log(`✅ Created database: Monthly Reports (${db.id})`);
  return db;
}

// ─── DATA SEEDERS ─────────────────────────────────────────────────────────────

async function seedClients(dbId) {
  const clients = [
    { name: 'Aarni by Sharavani', industry: 'Fine Jewellery', smm: 'Tia',      status: 'Active', services: ['Social Media', 'Ads'],               handle: '@aarnibysharavani' },
    { name: 'Atul Jewellers',      industry: 'Jewellery',      smm: 'Vanshika', status: 'Active', services: ['Social Media', 'Ads', 'Branding'],    handle: '@atuljewellers' },
    { name: 'Bhagat Jewellers',    industry: 'Jewellery',      smm: 'Tia',      status: 'Active', services: ['Social Media'],                       handle: '@bhagatjewellers' },
    { name: 'Beri Jewellers',      industry: 'Jewellery',      smm: 'Vanshika', status: 'Active', services: ['Social Media', 'Ads'],               handle: '@berijewellers' },
    { name: 'Gujranwala Jewellers', industry: 'Jewellery',     smm: 'Tia',      status: 'Active', services: ['Social Media', 'Ads'],               handle: '@gujranwalajewellers' },
    { name: 'Luminique',           industry: 'Luxury',         smm: 'Vanshika', status: 'Active', services: ['Social Media', 'Ads', 'Branding'],    handle: '@luminique' },
    { name: 'Vidhi Sheth',         industry: 'Fine Jewellery', smm: 'Tia',      status: 'Active', services: ['Social Media'],                       handle: '@vidhisheth' },
    { name: 'Karan Kothari Jewellers', industry: 'Jewellery',  smm: 'Vanshika', status: 'Active', services: ['Social Media', 'Ads'],               handle: '@karankotharijewellers' },
    { name: 'Avani',               industry: 'Fine Jewellery', smm: 'Tia',      status: 'Active', services: ['Branding'],                           handle: '@avani.jewels' },
    { name: 'Elmara',              industry: 'Luxury',         smm: 'Vanshika', status: 'Active', services: ['Website'],                            handle: '@elmara' },
  ];

  for (const c of clients) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Client Name':   { title: [{ text: { content: c.name } }] },
        'Industry':      { select: { name: c.industry } },
        'SMM Assigned':  { rich_text: [{ text: { content: c.smm } }] },
        'Status':        { select: { name: c.status } },
        'Services':      { multi_select: c.services.map(s => ({ name: s })) },
        'Instagram Handle': { rich_text: [{ text: { content: c.handle } }] },
        'Contract Start Date': { date: { start: '2024-01-01' } },
      },
    });
    log(`  → Added client: ${c.name}`);
  }
}

async function seedWorkflow(dbId) {
  const tasks = [
    { name: 'June Content Strategy — Aarni',        client: 'Aarni by Sharavani', owner: 'Tia',      status: 'In Progress', due: '2026-06-12', priority: 'High',   type: 'Strategy',  day: 'Monday' },
    { name: 'Design Reel Covers — Luminique',       client: 'Luminique',          owner: 'Mahima',   status: 'Not Started', due: '2026-06-13', priority: 'High',   type: 'Design',    day: 'Tuesday' },
    { name: 'Meta Ads Setup — Beri Jewellers',      client: 'Beri Jewellers',     owner: 'Pratyusha', status: 'In Progress', due: '2026-06-14', priority: 'High',   type: 'Ads',       day: 'Wednesday' },
    { name: 'Monthly Report Review — Atul',         client: 'Atul Jewellers',     owner: 'Manika',   status: 'Review',      due: '2026-06-15', priority: 'Medium', type: 'Reporting', day: 'Thursday' },
    { name: 'Client Approval — Gujranwala Batch 2', client: 'Gujranwala Jewellers', owner: 'Tia',    status: 'Not Started', due: '2026-06-16', priority: 'Medium', type: 'Approval',  day: 'Friday' },
  ];

  for (const t of tasks) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Task Name': { title: [{ text: { content: t.name } }] },
        'Client':    { rich_text: [{ text: { content: t.client } }] },
        'Owner':     { rich_text: [{ text: { content: t.owner } }] },
        'Status':    { select: { name: t.status } },
        'Due Date':  { date: { start: t.due } },
        'Priority':  { select: { name: t.priority } },
        'Task Type': { select: { name: t.type } },
        'Day':       { select: { name: t.day } },
      },
    });
    log(`  → Added task: ${t.name}`);
  }
}

async function seedContentCalendar(dbId) {
  const posts = [
    {
      title: 'Solitaire Reel — Aarni June Week 1',
      client: 'Aarni by Sharavani', platform: 'Reel',          date: '2026-06-11',
      status: 'In Design',  smm: 'Tia',      type: 'Reel',
      intent: 'Awareness', hook: 'Show the sparkle of our new solitaire line',
      copy: 'Timeless. Brilliant. Yours.', collection: 'Solitaire 2024',
    },
    {
      title: 'Bridal Carousel — Atul Jewellers',
      client: 'Atul Jewellers',     platform: 'Carousel',      date: '2026-06-12',
      status: 'Approved',   smm: 'Vanshika', type: 'Carousel',
      intent: 'Conversion', hook: 'Bridal season — showcase full wedding sets',
      copy: 'Your dream bridal look starts here.', collection: 'Bridal 2024',
    },
    {
      title: 'Behind the Scenes Story — Bhagat',
      client: 'Bhagat Jewellers',   platform: 'Story',          date: '2026-06-13',
      status: 'Brief Pending', smm: 'Tia',   type: 'Story',
      intent: 'Engagement', hook: 'Show craftsmanship process',
      copy: 'Crafted with love, worn with pride.', collection: 'Artisan Series',
    },
    {
      title: 'New Collection Drop — Luminique',
      client: 'Luminique',          platform: 'Instagram Post', date: '2026-06-14',
      status: 'Scheduled',  smm: 'Vanshika', type: 'Post',
      intent: 'Launch',     hook: 'Announce SS26 luxury collection',
      copy: 'Introducing the SS26 Edit — where luxury meets light.', collection: 'SS26',
    },
    {
      title: 'Product Highlight Reel — Vidhi Sheth',
      client: 'Vidhi Sheth',        platform: 'Reel',           date: '2026-06-15',
      status: 'Designed',   smm: 'Tia',      type: 'Reel',
      intent: 'Awareness',  hook: 'Highlight signature pieces with close-up shots',
      copy: 'Everyday elegance, elevated.', collection: 'Signature Edit',
    },
  ];

  for (const p of posts) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Post Title':     { title: [{ text: { content: p.title } }] },
        'Client':         { rich_text: [{ text: { content: p.client } }] },
        'Platform':       { select: { name: p.platform } },
        'Post Date':      { date: { start: p.date } },
        'Status':         { select: { name: p.status } },
        'Assigned SMM':   { rich_text: [{ text: { content: p.smm } }] },
        'Post Type':      { select: { name: p.type } },
        'Intent':         { rich_text: [{ text: { content: p.intent } }] },
        'Hook/Objective': { rich_text: [{ text: { content: p.hook } }] },
        'Image Copy':     { rich_text: [{ text: { content: p.copy } }] },
        'Collection':     { rich_text: [{ text: { content: p.collection } }] },
        'Caption Ready':  { checkbox: false },
        'Visual Ready':   { checkbox: p.status === 'Designed' || p.status === 'Approved' || p.status === 'Scheduled' },
      },
    });
    log(`  → Added post: ${p.title}`);
  }
}

async function seedApprovalLog(dbId) {
  const approvals = [
    { name: 'Aarni June Week 1 Batch',  client: 'Aarni by Sharavani', type: 'Content Batch', round: 1, smm: 'Submitted', tl: 'Approved',        client_s: 'Pending',          feedback: 'TL approved. Awaiting client sign-off.', date: '2026-06-09' },
    { name: 'Luminique SS26 Launch',    client: 'Luminique',          type: 'Content Batch', round: 2, smm: 'Submitted', tl: 'Revision Needed', client_s: 'Pending',          feedback: 'Caption tone needs refinement — too formal.', date: '2026-06-08' },
    { name: 'Atul Branding Deck Round 1', client: 'Atul Jewellers',   type: 'Branding',      round: 1, smm: 'Submitted', tl: 'Approved',        client_s: 'Revision Needed',  feedback: 'Client requested colour palette change to warmer tones.', date: '2026-06-07' },
  ];

  for (const a of approvals) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Item Name':      { title: [{ text: { content: a.name } }] },
        'Client':         { rich_text: [{ text: { content: a.client } }] },
        'Type':           { select: { name: a.type } },
        'Approval Round': { number: a.round },
        'SMM Status':     { select: { name: a.smm } },
        'TL Status':      { select: { name: a.tl } },
        'Client Status':  { select: { name: a.client_s } },
        'Feedback Notes': { rich_text: [{ text: { content: a.feedback } }] },
        'Date Submitted': { date: { start: a.date } },
      },
    });
    log(`  → Added approval: ${a.name}`);
  }
}

async function seedAdsTracker(dbId) {
  const ads = [
    { name: 'Aarni — Awareness June 2026',       client: 'Aarni by Sharavani', platform: 'Meta',   type: 'Video',   live: '2026-06-10', status: 'Live',      budget: 25000, spent: 8200,  manager: 'Pratyusha', notes: 'CPM ₹45, CTR 2.3% — performing above benchmark.' },
    { name: 'Beri — Conversion Campaign Q2',     client: 'Beri Jewellers',     platform: 'Meta',   type: 'Carousel', live: '2026-06-01', status: 'Live',     budget: 40000, spent: 21000, manager: 'Pratyusha', notes: 'ROAS 4.1x. Carousel format outperforming static.' },
    { name: 'Gujranwala — Bridal Season Ads',    client: 'Gujranwala Jewellers', platform: 'Meta', type: 'Static',  live: '2026-05-20', status: 'Paused',    budget: 30000, spent: 29500, manager: 'Pratyusha', notes: 'Budget nearly exhausted. Paused pending renewal.' },
  ];

  for (const a of ads) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Campaign Name':    { title: [{ text: { content: a.name } }] },
        'Client':           { rich_text: [{ text: { content: a.client } }] },
        'Platform':         { select: { name: a.platform } },
        'Ad Type':          { select: { name: a.type } },
        'Go Live Date':     { date: { start: a.live } },
        'Status':           { select: { name: a.status } },
        'Budget':           { number: a.budget },
        'Amount Spent':     { number: a.spent },
        'Managed By':       { rich_text: [{ text: { content: a.manager } }] },
        'Performance Notes': { rich_text: [{ text: { content: a.notes } }] },
        'Last Updated':     { date: { start: '2026-06-10' } },
      },
    });
    log(`  → Added ad campaign: ${a.name}`);
  }
}

async function seedProjects(dbId) {
  const projects = [
    { name: 'Avani Brand Identity',    client: 'Avani',   type: 'Branding',    vendor: 'Studio Ink',       status: 'In Progress', scheduled: '2026-05-15', delivery: '2026-06-30', owner: 'Manika',   contact: '+91 98100 11111', notes: 'Logo + brand kit underway. Final delivery end of June.' },
    { name: 'Elmara Website Build',    client: 'Elmara',  type: 'Website',     vendor: 'PixelCraft Studio', status: 'Briefed',     scheduled: '2026-06-05', delivery: '2026-07-15', owner: 'Manika',   contact: '+91 98100 22222', notes: 'Wireframes shared. Dev handoff next week.' },
    { name: 'Atul Q2 Product Shoot',   client: 'Atul Jewellers', type: 'Photo Shoot', vendor: 'Lens & Light Photography', status: 'Delivered', scheduled: '2026-05-28', delivery: '2026-06-06', owner: 'Tia', contact: '+91 98100 33333', notes: 'All images received and sorted in Drive. Ready for scheduling.' },
  ];

  for (const p of projects) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Project Name':   { title: [{ text: { content: p.name } }] },
        'Client':         { rich_text: [{ text: { content: p.client } }] },
        'Project Type':   { select: { name: p.type } },
        'Vendor Name':    { rich_text: [{ text: { content: p.vendor } }] },
        'Status':         { select: { name: p.status } },
        'Scheduled Date': { date: { start: p.scheduled } },
        'Delivery Date':  { date: { start: p.delivery } },
        'Internal Owner': { rich_text: [{ text: { content: p.owner } }] },
        'Vendor Contact': { rich_text: [{ text: { content: p.contact } }] },
        'Notes':          { rich_text: [{ text: { content: p.notes } }] },
      },
    });
    log(`  → Added project: ${p.name}`);
  }
}

async function seedReports(dbId) {
  const reports = [
    {
      title: 'Aarni — May 2026 Monthly Report',
      client: 'Aarni by Sharavani', month: '2026-05-01', status: 'Sent to Client',
      smm: 'Tia', metrics: 'Reach: 48K | Engagement: 5.2% | Followers: +312',
      reach: '48,000', engagement: '5.2%', followers: '312',
    },
    {
      title: 'Luminique — May 2026 Monthly Report',
      client: 'Luminique',           month: '2026-05-01', status: 'In Review',
      smm: 'Vanshika', metrics: 'Reach: 72K | Engagement: 6.8% | Followers: +520',
      reach: '72,000', engagement: '6.8%', followers: '520',
    },
  ];

  for (const r of reports) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        'Report Title':    { title: [{ text: { content: r.title } }] },
        'Client':          { rich_text: [{ text: { content: r.client } }] },
        'Report Month':    { date: { start: r.month } },
        'Status':          { select: { name: r.status } },
        'SMM Assigned':    { rich_text: [{ text: { content: r.smm } }] },
        'Key Metrics':     { rich_text: [{ text: { content: r.metrics } }] },
        'Reach':           { rich_text: [{ text: { content: r.reach } }] },
        'Engagement Rate': { rich_text: [{ text: { content: r.engagement } }] },
        'New Followers':   { rich_text: [{ text: { content: r.followers } }] },
      },
    });
    log(`  → Added report: ${r.title}`);
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  log('🚀 Starting Gryd Co. Notion workspace build...\n');

  // STEP 1: Create top-level pages
  log('── STEP 1: Creating top-level pages ──');
  const clientsPage    = await createTopLevelPage('Clients',    '🏢');
  log(`✅ Created page: Clients (${clientsPage.id})`);
  const opsPage        = await createTopLevelPage('Operations', '⚙️');
  log(`✅ Created page: Operations (${opsPage.id})`);
  const reportingPage  = await createTopLevelPage('Reporting',  '📊');
  log(`✅ Created page: Reporting (${reportingPage.id})`);

  // STEP 2: Create all 8 databases
  log('\n── STEP 2: Creating databases ──');
  const clientHubDb      = await createClientHub(clientsPage.id);
  const workflowDb       = await createWorkflowTracker(opsPage.id);
  const calendarDb       = await createContentCalendar(opsPage.id);
  const approvalDb       = await createApprovalLog(opsPage.id);
  const revisionDb       = await createRevisionLog(opsPage.id);
  const adsDb            = await createAdsTracker(opsPage.id);
  const projectsDb       = await createProjectsTracker(opsPage.id);
  const reportsDb        = await createMonthlyReports(reportingPage.id);

  // STEP 3: Seed all 10 clients
  log('\n── STEP 3: Adding 10 clients to Client Hub ──');
  await seedClients(clientHubDb.id);

  // STEP 4: Sample data
  log('\n── STEP 4: Adding sample data ──');

  log('\n  [Workflow Tracker — 5 tasks]');
  await seedWorkflow(workflowDb.id);

  log('\n  [Content Calendar — 5 posts]');
  await seedContentCalendar(calendarDb.id);

  log('\n  [Approval Log — 3 entries]');
  await seedApprovalLog(approvalDb.id);

  log('\n  [Ads Tracker — 3 campaigns]');
  await seedAdsTracker(adsDb.id);

  log('\n  [Projects Tracker — 3 projects]');
  await seedProjects(projectsDb.id);

  log('\n  [Monthly Reports — 2 reports]');
  await seedReports(reportsDb.id);

  // Summary
  log('\n══════════════════════════════════════════════');
  log('🎉 Gryd Co. Notion workspace build COMPLETE!');
  log('══════════════════════════════════════════════');
  log(`\n📁 Top-Level Pages:`);
  log(`   Clients    → https://www.notion.so/${clientsPage.id.replace(/-/g, '')}`);
  log(`   Operations → https://www.notion.so/${opsPage.id.replace(/-/g, '')}`);
  log(`   Reporting  → https://www.notion.so/${reportingPage.id.replace(/-/g, '')}`);
  log(`\n🗄️  Databases:`);
  log(`   Client Hub       → https://www.notion.so/${clientHubDb.id.replace(/-/g, '')}`);
  log(`   Workflow Tracker → https://www.notion.so/${workflowDb.id.replace(/-/g, '')}`);
  log(`   Content Calendar → https://www.notion.so/${calendarDb.id.replace(/-/g, '')}`);
  log(`   Approval Log     → https://www.notion.so/${approvalDb.id.replace(/-/g, '')}`);
  log(`   Revision Log     → https://www.notion.so/${revisionDb.id.replace(/-/g, '')}`);
  log(`   Ads Tracker      → https://www.notion.so/${adsDb.id.replace(/-/g, '')}`);
  log(`   Projects Tracker → https://www.notion.so/${projectsDb.id.replace(/-/g, '')}`);
  log(`   Monthly Reports  → https://www.notion.so/${reportsDb.id.replace(/-/g, '')}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  if (err.body) console.error('   API body:', JSON.stringify(err.body, null, 2));
  process.exit(1);
});
