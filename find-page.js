const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
  console.log('Searching for pages your integration can access...\n');

  const res = await notion.search({ page_size: 20 });

  if (res.results.length === 0) {
    console.log('❌ No pages found.');
    console.log('\nYour integration has not been connected to any pages yet.');
    console.log('Open Notion (app or browser), open any page, click ... → Connections → enable your integration.');
    return;
  }

  console.log(`✅ Found ${res.results.length} item(s):\n`);
  for (const item of res.results) {
    const title =
      item.object === 'page'
        ? item.properties?.title?.title?.[0]?.plain_text || '(untitled)'
        : item.title?.[0]?.plain_text || '(untitled)';
    const id = item.id.replace(/-/g, '');
    console.log(`  [${item.object.toUpperCase()}] ${title}`);
    console.log(`         ID: ${item.id}`);
    console.log(`        URL: https://www.notion.so/${id}\n`);
  }

  const firstPage = res.results.find(r => r.object === 'page');
  if (firstPage) {
    const id = firstPage.id.replace(/-/g, '');
    const title = firstPage.properties?.title?.title?.[0]?.plain_text || '(untitled)';
    console.log('─────────────────────────────────────────');
    console.log(`Run the build script using "${title}" as parent:`);
    console.log(`\n  set NOTION_PARENT_ID=${firstPage.id}`);
    console.log(`  node build.js\n`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
});
