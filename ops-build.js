const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

const GS   = '37b6b847-91e8-8025-99c1-f6185bd0fda7'; // Getting Started
const WF   = '37b6b847-91e8-81c1-bed2-d9f3afad6390';
const CC   = '37b6b847-91e8-81cc-ae0d-ebecf7d139fc';
const AL   = '37b6b847-91e8-8153-808b-d51a18994bb0';
const RL   = '37b6b847-91e8-8166-800c-dd4518cd5801';
const AT   = '37b6b847-91e8-81bb-9922-c856c248ba7d';
const PT   = '37b6b847-91e8-8104-a5fc-e550f9d22eb1';
const MR   = '37b6b847-91e8-81b2-b76b-c4c7c46f13f0';
const CH   = '37b6b847-91e8-8115-9892-d139d7fa0428';

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
const add = (pid, children) => api('PATCH', `blocks/${pid}/children`, { children });

const h1  = t => ({ type:'heading_1',  heading_1:  { rich_text:[{type:'text',text:{content:t}}] } });
const h2  = t => ({ type:'heading_2',  heading_2:  { rich_text:[{type:'text',text:{content:t}}] } });
const h3  = t => ({ type:'heading_3',  heading_3:  { rich_text:[{type:'text',text:{content:t}}] } });
const p   = t => ({ type:'paragraph',  paragraph:  { rich_text:[{type:'text',text:{content:t}}] } });
const div = () => ({ type:'divider',   divider:    {} });
const bul = (t, link) => ({ type:'bulleted_list_item', bulleted_list_item:{ rich_text:[{type:'text',text: link?{content:t,link:{url:link}}:{content:t}}] } });
const num = (t) => ({ type:'numbered_list_item', numbered_list_item:{ rich_text:[{type:'text',text:{content:t}}] } });
const callout = (t, emoji) => ({ type:'callout', callout:{ rich_text:[{type:'text',text:{content:t}}], icon:{type:'emoji',emoji} } });
const toggle = (t, children) => ({ type:'toggle', toggle:{ rich_text:[{type:'text',text:{content:t}}], children } });

// ── Post toggle builder ────────────────────────────────────────────────────
function postBlock(po) {
  const title = `${po.day}  ·  ${po.type}  ·  ${po.intent}`;
  return toggle(title, [
    bul(`Hook / Objective: ${po.hook}`),
    bul(`Image Copy: ${po.copy}`),
    bul(`Collection / Campaign: ${po.collection}`),
    po.brief && po.brief !== '—' ? bul(`Brief / Reference: ${po.brief}`, po.brief.startsWith('http') ? po.brief : undefined) : bul('Brief / Reference: TBD'),
    bul(`Status: ${po.status}`),
  ]);
}
function storyBlock(s) {
  return toggle(`${s.day}  ·  Story  ·  ${s.intent}`, [
    bul(`Content: ${s.copy}`),
    s.link ? bul(`Link: ${s.link}`, s.link) : bul('Link: —'),
    bul(`Status: ${s.status || 'Scheduled'}`),
  ]);
}

// ── Calendar data ──────────────────────────────────────────────────────────
const CAL = {
  "Karan Kothari Jewellers": {
    smm: "Vanshika", color: "#065f46",
    posts: [
      {day:"1 Jun",type:"Reel",intent:"Product highlight",hook:"Product Desire + Visual Impact + Reach",copy:"Every bride remembers the moment the jewellery finally made her feel like a bride. Hand-carved patterns, precious stone accents. Visit the store — find the piece made for your wedding day.",collection:"Bridal Edit",brief:"https://pin.it/3tDnLibw",status:"Scheduled"},
      {day:"2 Jun",type:"Reel",intent:"Filler",hook:"Festive Curiosity + Campaign Awareness + Reach",copy:"Karan Kothari Jewellers presents SHUBH VIVAH — a bridal jewellery experience crafted for the wedding moments your family will remember forever. From timeless bridal sets to wedding-day essentials.",collection:"Shubh Vivah",brief:"https://pin.it/6U8w3xqvY",status:"In Design"},
      {day:"4 Jun",type:"Reel",intent:"Engagement",hook:"Heirloom Framing + Emotional Storytelling + Saves",copy:"Wedding guest jewellery essentials you'll actually wear. Because repeating outfits is okay. Repeating jewellery styling? Never.",collection:"Guest Edit",brief:"https://pin.it/58r7H7EvM",status:"Brief Pending"},
      {day:"5 Jun",type:"Reel",intent:"Engagement",hook:"Product Desire + Family Legacy Positioning + Saves",copy:"The Plain Gold Jewellery Collection — bridal chokers, long haars, bangles and statement gold sets made for every wedding moment. Flat 9% Making Charges on Plain Gold.",collection:"Plain Gold",brief:"https://pin.it/7Hv407Zzm",status:"Approved"},
      {day:"6 Jun",type:"Reel",intent:"Filler",hook:"Offer Curiosity + Reach + Engagement",copy:"TBD",collection:"—",brief:"https://pin.it/58r7H7EvM",status:"Brief Pending"},
      {day:"8 Jun",type:"Post",intent:"Product highlight",hook:"Heritage + Craftsmanship + Brand Trust",copy:"100 years. One craft. Infinite stories. Karan Kothari Jewellers — since 1924.",collection:"Heritage",brief:"—",status:"Scheduled"},
      {day:"10 Jun",type:"Carousel",intent:"Engagement",hook:"Wedding season essentials — Saves",copy:"Four pieces. Endless combinations. Slide 1: The statement necklace. Slide 2: The stacking bangles. Slide 3: The cocktail ring. Slide 4: The ear cuff.",collection:"Statement Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Product highlight",hook:"Plain gold — everyday luxury + DMs",copy:"Plain gold, pure joy. Shop the collection in-store. Flat 9% making charges, this week only.",collection:"Plain Gold",brief:"—",status:"Scheduled"},
      {day:"15 Jun",type:"Post",intent:"Filler / BTS",hook:"Behind the scenes — curiosity + trust",copy:"This is where it all begins. Behind every piece at Karan Kothari Jewellers is hours of craft, care and precision.",collection:"Studio BTS",brief:"—",status:"In Design"},
      {day:"18 Jun",type:"Carousel",intent:"Engagement",hook:"Bride vs guest — relatable + Saves",copy:"Slide 1: What the bride wears. Slide 2: What the guests wear. Slide 3: The rule? There is none. Just Karan Kothari.",collection:"Bridal Edit",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"1 Jun",intent:"Offer",copy:"Flat 9% Making Charges — Today only",link:null,status:"Scheduled"},
      {day:"3 Jun",intent:"Product",copy:"New arrivals — Bridal chokers",link:null,status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"Poll: Gold or diamonds for your wedding?",link:null,status:"Scheduled"},
      {day:"7 Jun",intent:"BTS",copy:"Meet our karigars — swipe up",link:null,status:"Scheduled"},
      {day:"10 Jun",intent:"Offer",copy:"Weekend special — Visit the store",link:null,status:"Scheduled"},
    ]
  },
  "Aarni by Sharavani": {
    smm: "Tia", color: "#7c3aed",
    posts: [
      {day:"5 Jun",type:"Reel",intent:"Awareness / Brand",hook:"These aren't just bangles... — Curiosity + Reach",copy:"Hand-forged. Stone-set. Made to be worn for decades. The Aarni Summer Collection is here.",collection:"Summer Collection",brief:"https://drive.google.com/",status:"Posted"},
      {day:"8 Jun",type:"Post",intent:"Product highlight",hook:"One piece. Every occasion. — Versatility + DMs",copy:"From boardroom to wedding mandap — this is the necklace that does it all. Aarni by Sharavani.",collection:"Everyday Luxury",brief:"https://drive.google.com/",status:"Scheduled"},
      {day:"12 Jun",type:"Carousel",intent:"Sales",hook:"The edit you've been waiting for — Saves + DMs",copy:"Slide 1: The gold cuff. Slide 2: The stone drops. Slide 3: The layering set. Shop the Summer Edit — link in bio.",collection:"Summer Collection",brief:"https://drive.google.com/",status:"In Design"},
      {day:"15 Jun",type:"Reel",intent:"Brand story",hook:"Made by hand. Worn with intent. — Saves + Trust",copy:"Every piece at Aarni begins the same way — with a sketch, a story, and a stone. This is how it's made.",collection:"Artisan Series",brief:"—",status:"Brief Pending"},
      {day:"19 Jun",type:"Post",intent:"Community / Emotional",hook:"Who are you wearing it for? — Saves + Comments",copy:"Your grandmother wore gold differently. Your mother wore it proudly. You wear it on your own terms. Aarni. For every generation.",collection:"Heritage",brief:"—",status:"Brief Pending"},
      {day:"23 Jun",type:"Carousel",intent:"Education / Styling",hook:"How to style solitaires — Saves + Shares",copy:"Slide 1: Morning — solitaire studs. Slide 2: Office — minimal necklace. Slide 3: Evening — stacked rings. Slide 4: Weekend — layered bracelets.",collection:"Styling Guide",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"2 Jun",intent:"Product",copy:"New drop — Summer bangles. Available in-store.",link:null,status:"Scheduled"},
      {day:"4 Jun",intent:"Engagement",copy:"This or that: Stack or solo?",link:null,status:"Scheduled"},
      {day:"8 Jun",intent:"BTS",copy:"Inside the studio — watch this",link:null,status:"Scheduled"},
      {day:"12 Jun",intent:"Offer",copy:"DM us to enquire about the Summer Edit",link:null,status:"Scheduled"},
    ]
  },
  "Atul Jewellers": {
    smm: "Vanshika", color: "#0369a1",
    posts: [
      {day:"2 Jun",type:"Reel",intent:"Brand / Seasonal",hook:"Bridal season is here. Are you ready? — Reach + DMs",copy:"The bridal collection you've been waiting for is now here. From heavy bridal sets to delicate pieces for every function. Atul Jewellers.",collection:"Bridal 2025",brief:"—",status:"Posted"},
      {day:"5 Jun",type:"Post",intent:"Product",hook:"New arrivals — FOMO + DMs",copy:"Fresh arrivals this week. Over 500 designs across all budgets. Stop by and explore. Mon–Sun, 10AM–8PM.",collection:"New Arrivals",brief:"—",status:"Scheduled"},
      {day:"9 Jun",type:"Carousel",intent:"Education",hook:"The complete bridal jewellery checklist — Saves",copy:"Slide 1: The bridal necklace. Slide 2: The maang tikka. Slide 3: The earring set. Slide 4: The bangles. Slide 5: The payal. All available at Atul Jewellers.",collection:"Bridal Checklist",brief:"—",status:"In Design"},
      {day:"13 Jun",type:"Reel",intent:"Brand story / BTS",hook:"Heritage meets modern craftsmanship — Trust + Saves",copy:"Our karigars have been crafting jewellery for three generations. Every piece that leaves our showroom carries that legacy with it.",collection:"Heritage BTS",brief:"—",status:"Brief Pending"},
      {day:"17 Jun",type:"Post",intent:"Offer",hook:"Wedding season special — Appointments available",copy:"Getting married this season? Book a private consultation at our showroom. Custom designs and resizing available. Call to book.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"21 Jun",type:"Reel",intent:"Engagement",hook:"Before the wedding vs after — relatable + Comments",copy:"Before the wedding: saving for the perfect set. After the wedding: wondering how to store it all beautifully. We have both covered. Visit us.",collection:"Bridal",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"3 Jun",intent:"Product",copy:"New bridal set arrivals — come see us",link:null,status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Book a consultation this week",link:null,status:"Scheduled"},
      {day:"10 Jun",intent:"BTS",copy:"Inside the workshop — watch this",link:null,status:"Brief Pending"},
      {day:"14 Jun",intent:"Engagement",copy:"Quiz: What's your bridal jewellery style?",link:null,status:"Brief Pending"},
    ]
  },
  "Bhagat Jewellers": {
    smm: "Tia", color: "#0f766e",
    posts: [
      {day:"2 Jun",type:"Reel",intent:"Brand",hook:"Classic jewellery for the modern Indian woman — Reach",copy:"Classic gold. Classic craftsmanship. Bhagat Jewellers — where every piece tells a story passed down through generations.",collection:"Classic Collection",brief:"—",status:"In Design"},
      {day:"5 Jun",type:"Post",intent:"Trust / Craft",hook:"Crafted with care. Worn for generations. — Trust + Saves",copy:"Our artisans put over 200 hours into every bridal set. That's not jewellery. That's legacy.",collection:"Bridal",brief:"—",status:"Brief Pending"},
      {day:"8 Jun",type:"Carousel",intent:"Education",hook:"Your complete bridal jewellery guide — Saves",copy:"Slide 1: The maang tikka. Slide 2: The necklace. Slide 3: The earrings. Slide 4: The bangles. Everything you need, all in one place.",collection:"Bridal Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Product",hook:"The piece that goes with everything — DMs + Saves",copy:"One necklace. Ten outfits. Zero compromises. Visit us in-store this week and find yours.",collection:"Everyday Collection",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Footfall",hook:"Walk in and find your piece — CTR",copy:"Walk in. Find your piece. Walk out feeling like royalty. Open 7 days a week, 10AM–8PM.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"20 Jun",type:"Carousel",intent:"Styling",hook:"5 jewellery pieces every collection needs — Saves",copy:"Slide 1: A solid bangle set. Slide 2: A versatile necklace. Slide 3: Statement earrings. Slide 4: A cocktail ring. Slide 5: The ear cuff.",collection:"Essentials Edit",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"3 Jun",intent:"Product",copy:"New arrivals in-store this week",link:null,status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Weekend special — visit us",link:null,status:"Brief Pending"},
      {day:"10 Jun",intent:"Engagement",copy:"Poll: Gold or silver jewellery?",link:null,status:"Brief Pending"},
      {day:"14 Jun",intent:"BTS",copy:"Behind the showcase — our artisans at work",link:null,status:"Brief Pending"},
    ]
  },
  "Beri Jewellers": {
    smm: "Vanshika", color: "#b45309",
    posts: [
      {day:"1 Jun",type:"Reel",intent:"Brand",hook:"Bold isn't a choice. It's a statement. — Reach + Brand recall",copy:"Bold. Unapologetic. Made to be noticed. The Beri Statement Collection — now in-store.",collection:"Statement Collection",brief:"—",status:"In Progress"},
      {day:"4 Jun",type:"Carousel",intent:"Styling",hook:"Stack it. Layer it. Own it. — Saves",copy:"Slide 1: The single bold bangle. Slide 2: The stacked set. Slide 3: The full arm party. Which one are you?",collection:"Stack Edit",brief:"—",status:"Brief Pending"},
      {day:"7 Jun",type:"Post",intent:"Product",hook:"New drops you didn't know you needed — DMs",copy:"New arrivals just dropped. The cocktail rings you've been waiting for. Shop in-store or DM to enquire.",collection:"Cocktail Edit",brief:"—",status:"Brief Pending"},
      {day:"11 Jun",type:"Reel",intent:"Brand story",hook:"Made for the woman who wears what she wants — Comments",copy:"There are no rules here. Just jewellery that makes a statement. Beri Jewellers — for the bold.",collection:"Brand",brief:"—",status:"Brief Pending"},
      {day:"15 Jun",type:"Post",intent:"Product",hook:"One pair of earrings. Every occasion. — DMs",copy:"Statement earrings — the only accessory you need today. Shop the collection in-store.",collection:"Earring Edit",brief:"—",status:"Brief Pending"},
      {day:"20 Jun",type:"Reel",intent:"Engagement",hook:"Minimal vs bold — what's your style? — Comments + Saves",copy:"They say less is more. We say more is more. Which side are you on? Drop your answer below.",collection:"Brand",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"2 Jun",intent:"Offer",copy:"New in store — come see us",link:null,status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"This or that: Bold or minimal?",link:null,status:"Brief Pending"},
      {day:"9 Jun",intent:"Product",copy:"New drops — cocktail rings",link:null,status:"Brief Pending"},
      {day:"13 Jun",intent:"BTS",copy:"Behind the design process",link:null,status:"Brief Pending"},
    ]
  },
  "Gujranwala Jewellers": {
    smm: "Tia", color: "#be185d",
    posts: [
      {day:"1 Jun",type:"Post",intent:"Brand / Heritage",hook:"A legacy of craft and trust — Brand recall",copy:"Every piece we create carries the heritage of Gujranwala with it. A legacy of craft, quality and trust — passed down for generations.",collection:"Heritage Collection",brief:"—",status:"Scheduled"},
      {day:"4 Jun",type:"Reel",intent:"Product",hook:"The gold your family will love — Reach + DMs",copy:"Traditional designs that stand the test of time. Crafted for today's bride. Treasured by generations. Visit our showroom this week.",collection:"Bridal",brief:"—",status:"In Design"},
      {day:"8 Jun",type:"Carousel",intent:"Education",hook:"Bridal sets that tell a story — Saves",copy:"Slide 1: The heavy full set. Slide 2: The medium set for functions. Slide 3: The light daily wear. Slide 4: The cocktail pieces. Every bride, every budget.",collection:"Bridal Sets",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Brand / BTS",hook:"Traditional designs. Modern hearts. — Trust + Saves",copy:"Our karigars have been crafting jewellery for over 50 years. This is their story. Watch till the end.",collection:"Artisan BTS",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Footfall",hook:"Book your consultation — CTR",copy:"Walk in any day this week and explore our full bridal collection. Custom orders welcome. Call to book your appointment.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"21 Jun",type:"Carousel",intent:"Engagement",hook:"Then vs now — nostalgia + Saves + Shares",copy:"Slide 1: The jewellery our grandmothers wore. Slide 2: The jewellery our mothers wore. Slide 3: The jewellery we wear today. Heritage never goes out of style.",collection:"Heritage",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"3 Jun",intent:"Product",copy:"New bridal set arrivals this week",link:null,status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Book a consultation — limited slots",link:null,status:"Brief Pending"},
      {day:"10 Jun",intent:"Engagement",copy:"Poll: Traditional or fusion bridal?",link:null,status:"Brief Pending"},
    ]
  },
  "Luminique": {
    smm: "Vanshika", color: "#1d4ed8",
    posts: [
      {day:"1 Jun",type:"Reel",intent:"Brand / Launch",hook:"Luxury is a feeling. This is it. — Reach + Brand recall",copy:"Luminique. Crafted for those who know. New season collection — now available. DM to enquire.",collection:"New Season",brief:"—",status:"Scheduled"},
      {day:"4 Jun",type:"Post",intent:"Brand story",hook:"For those who know. — Aspirational + Saves",copy:"Luminique was created for a specific kind of woman. She doesn't follow trends. She sets them. The new season collection is here.",collection:"Brand",brief:"—",status:"In Design"},
      {day:"8 Jun",type:"Carousel",intent:"Product",hook:"The luxury edit — June 2025 — Saves + DMs",copy:"Slide 1: The statement necklace. Slide 2: The cocktail ring. Slide 3: The ear cuff. Slide 4: The bracelet stack. Curated luxury — every single piece.",collection:"Luxury Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Styling",hook:"How to wear luxury jewellery every day — Saves",copy:"Board meeting to black tie dinner. One collection. Endless occasions. This is how Luminique clients do it.",collection:"Styling Series",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Community",hook:"The Luminique woman — identity + Comments",copy:"You don't wear Luminique to be noticed. You wear it because you know the difference. New arrivals in-store this week.",collection:"Brand",brief:"—",status:"Brief Pending"},
      {day:"22 Jun",type:"Reel",intent:"Campaign",hook:"New season, new light. — Hype + DMs",copy:"Everything new at Luminique this season. Watch this. Then DM us.",collection:"New Season",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"2 Jun",intent:"Product",copy:"New arrivals — Statement collection. DM to enquire.",link:null,status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"This or that: Gold or platinum?",link:null,status:"Brief Pending"},
      {day:"9 Jun",intent:"Offer",copy:"Private viewing this week — book your slot",link:null,status:"Brief Pending"},
      {day:"13 Jun",intent:"BTS",copy:"Inside the atelier — watch this",link:null,status:"Brief Pending"},
      {day:"17 Jun",intent:"Product",copy:"The piece everyone's asking about",link:null,status:"Brief Pending"},
    ]
  },
  "Vidhi Sheth": {
    smm: "Tia", color: "#7e22ce",
    posts: [
      {day:"2 Jun",type:"Post",intent:"Brand",hook:"Contemporary fine jewellery for the modern woman — Brand recall",copy:"Fine jewellery designed for women who live fully. Contemporary, thoughtful, made to be worn every single day. Vidhi Sheth.",collection:"Everyday Fine",brief:"—",status:"Scheduled"},
      {day:"5 Jun",type:"Reel",intent:"Product",hook:"Your signature piece — DMs",copy:"Every woman has a piece that's unmistakably hers. What's yours? Shop the Vidhi Sheth collection and find yours this week.",collection:"Signature Collection",brief:"—",status:"In Design"},
      {day:"9 Jun",type:"Carousel",intent:"Styling",hook:"The everyday edit — Saves",copy:"Slide 1: Morning coffee ring. Slide 2: Work necklace. Slide 3: Evening earrings. Slide 4: Weekend cuff. Fine jewellery for every moment.",collection:"Everyday Edit",brief:"—",status:"Brief Pending"},
      {day:"13 Jun",type:"Reel",intent:"Brand",hook:"Fine jewellery. Everyday wear. — Saves + Reach",copy:"Fine jewellery doesn't need a special occasion. It IS the occasion. Shop the Vidhi Sheth everyday collection.",collection:"Everyday Fine",brief:"—",status:"Brief Pending"},
      {day:"17 Jun",type:"Post",intent:"Teaser",hook:"Coming soon — curiosity + follows",copy:"Something new is dropping next week. Your next favourite piece is almost here. Watch this space.",collection:"New Collection",brief:"—",status:"Brief Pending"},
      {day:"24 Jun",type:"Carousel",intent:"Education",hook:"How to care for fine jewellery — Saves + Shares",copy:"Slide 1: Storage tips. Slide 2: Cleaning guide. Slide 3: What to avoid. Slide 4: When to get it serviced. From us to you.",collection:"Care Guide",brief:"—",status:"Brief Pending"},
    ],
    stories: [
      {day:"3 Jun",intent:"Product",copy:"New everyday pieces in-store",link:null,status:"Scheduled"},
      {day:"7 Jun",intent:"Engagement",copy:"Poll: Rings or necklaces?",link:null,status:"Brief Pending"},
      {day:"11 Jun",intent:"BTS",copy:"Design process — watch this",link:null,status:"Brief Pending"},
    ]
  },
  "Avani": {
    smm: "Tia", color: "#9a3412",
    posts: [], stories: [],
    note: "Currently in branding phase (Brand Identity with Studio Ink — due June 30). Social media content calendar to be activated post brand launch in July 2025."
  },
  "Elmara": {
    smm: "Vanshika", color: "#4338ca",
    posts: [], stories: [],
    note: "Currently in website build phase (PixelCraft Studio — due July 15). Social media content calendar to be activated post website go-live."
  },
};

// ── Shoots data ─────────────────────────────────────────────────────────────
const SHOOTS = [
  {brand:"Aarni by Sharavani",smm:"Tia",type:"Product Shoot",vendor:"Studio Kiran",date:"15 Jun",delivery:"20 Jun",status:"Upcoming",location:"Studio, Delhi",concepts:["Solitaire Collection","Summer Bangles","Everyday Luxury Edit"],notes:"Product-only shoot. No models. 3 collections."},
  {brand:"Bhagat Jewellers",smm:"Tia",type:"Lifestyle Shoot",vendor:"Studio Kiran",date:"20 May",delivery:"25 May",status:"Delivered",location:"Studio",concepts:["Classic Collection"],notes:"Delivered. Assets in drive folder."},
  {brand:"Vidhi Sheth",smm:"Tia",type:"Product Shoot",vendor:"Lens & Light",date:"22 Jun",delivery:"27 Jun",status:"Upcoming",location:"On-site, Hauz Khas",concepts:["Contemporary Line","Daily Wear Edit"],notes:"On-site natural light shoot. Confirm location 3 days prior."},
  {brand:"Karan Kothari Jewellers",smm:"Vanshika",type:"Bridal Shoot",vendor:"Studio Kiran",date:"18 Jun",delivery:"22 Jun",status:"Upcoming",location:"Studio, Delhi",concepts:["Bridal Edit","Plain Gold Collection","Shubh Vivah Campaign"],notes:"2 models. Heavy bridal set + plain gold set. 4-hour session."},
  {brand:"Atul Jewellers",smm:"Vanshika",type:"Product Shoot",vendor:"Studio Kiran",date:"1 Jun",delivery:"7 Jun",status:"Delivered",location:"Studio",concepts:["Bridal Collection","Heritage Edit"],notes:"Delivered. Assets shared via drive."},
  {brand:"Luminique",smm:"Vanshika",type:"Lifestyle Shoot",vendor:"Lens & Light",date:"25 Jun",delivery:"30 Jun",status:"Upcoming",location:"Location TBD",concepts:["New Season Collection","Luxury Lifestyle"],notes:"Lifestyle shoot — model + location. Confirm venue by June 18."},
  {brand:"Gujranwala Jewellers",smm:"Tia",type:"Product Shoot",vendor:"Studio Kiran",date:"10 Jul",delivery:"15 Jul",status:"Planned",location:"Studio",concepts:["Heritage Collection","Bridal Sets"],notes:"Planned for July. Brief to be sent by June 25."},
  {brand:"Beri Jewellers",smm:"Vanshika",type:"Reel Shoot",vendor:"Lens & Light",date:"28 Jun",delivery:"2 Jul",status:"Planned",location:"Studio",concepts:["Statement Edit","Reel Series B"],notes:"Reel-only shoot. 3 reels. Confirm reel scripts before booking."},
];

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  log('Starting ops-build.js — Client Hubs + Photoshoots + Dashboard v2');

  // ── 1. FOUNDER DASHBOARD V2 ────────────────────────────────────────────
  log('Building 🏠 Founder Dashboard v2...');
  const dash = await mkPage(GS, '🏠 Founder Dashboard', '🏠');
  await add(dash.id, [
    callout('Central command for Gryd Co. — client health, team workload, approvals, and ad performance at a glance.', '🏠'),
    div(),
    h2('📋 Agency Overview'),
    h3('Team'),
    bul('Manika — Team Lead (oversight, approvals, client communication)'),
    bul('Tia — Social Media Manager  ·  Clients: Aarni, Bhagat, Gujranwala, Vidhi Sheth, Avani, Karan Kothari'),
    bul('Vanshika — Social Media Manager  ·  Clients: Atul, Beri, Luminique, Karan Kothari, Elmara'),
    bul('Mahima — Designer  ·  Executes content for all clients'),
    bul('Durga — Designer  ·  Executes content for all clients'),
    bul('Pratyusha — Digital Marketer  ·  Manages all ad campaigns'),
    div(),
    h3('Active Clients (10)'),
    toggle('Aarni by Sharavani  ·  SMM: Tia  ·  Social Media + Ads', [bul('Instagram: @aarnibysharavani  ·  Industry: Fine Jewellery'), bul('Ad Budget: ₹65,000/mo  ·  Platforms: Meta + Google')]),
    toggle('Atul Jewellers  ·  SMM: Vanshika  ·  Social Media + Ads + Branding', [bul('Instagram: @atuljewellers  ·  Industry: Traditional + Bridal Jewellery'), bul('Ad Budget: ₹50,000/mo  ·  Branding with Designhaus — ongoing')]),
    toggle('Bhagat Jewellers  ·  SMM: Tia  ·  Social Media', [bul('Instagram: @bhagatjewellers  ·  Industry: Classic Jewellery'), bul('No ads. Organic only.')]),
    toggle('Beri Jewellers  ·  SMM: Vanshika  ·  Social Media + Ads', [bul('Instagram: @berijewellers  ·  Industry: Statement Jewellery'), bul('Ad Budget: ₹30,000/mo  ·  Platform: Meta')]),
    toggle('Gujranwala Jewellers  ·  SMM: Tia  ·  Social Media + Ads', [bul('Instagram: @gujranwalajewellers  ·  Industry: Heritage Jewellery'), bul('Ad Budget: ₹35,000/mo  ·  Platforms: Meta + Google')]),
    toggle('Luminique  ·  SMM: Vanshika  ·  Social Media + Ads + Branding', [bul('Instagram: @luminique  ·  Industry: Luxury Jewellery & Lifestyle'), bul('Ad Budget: ₹55,000/mo  ·  Branding with Designhaus — in review')]),
    toggle('Vidhi Sheth  ·  SMM: Tia  ·  Social Media', [bul('Instagram: @vidhisheth  ·  Industry: Contemporary Fine Jewellery'), bul('No ads. Organic only.')]),
    toggle('Karan Kothari Jewellers  ·  SMM: Vanshika  ·  Social Media + Ads', [bul('Instagram: @karankotharijewellers  ·  Industry: Premium Jewellery'), bul('Ad Budget: ₹25,000/mo  ·  Campaign drafts in progress')]),
    toggle('Avani  ·  SMM: Tia  ·  Branding (in progress)', [bul('Instagram: @avani.jewels  ·  Industry: Fine Jewellery'), bul('Branding phase — Studio Ink  ·  Delivery: June 30  ·  Social media starts July')]),
    toggle('Elmara  ·  SMM: Vanshika  ·  Website (in progress)', [bul('Instagram: @elmara  ·  Industry: Luxury Brand'), bul('Website phase — PixelCraft Studio  ·  Delivery: July 15  ·  Social media starts August')]),
    div(),
  ]);
  await add(dash.id, [
    h2('📅 June Deadlines'),
    bul('June 15 — Aarni Product Shoot  ·  Studio Kiran  ·  Delivery: June 20'),
    bul('June 18 — Karan Kothari Bridal Shoot  ·  Studio Kiran  ·  Delivery: June 22'),
    bul('June 22 — Vidhi Sheth Product Shoot  ·  Lens & Light  ·  Delivery: June 27'),
    bul('June 25 — Luminique Lifestyle Shoot  ·  Lens & Light  ·  Delivery: June 30'),
    bul('June 28 — Beri Jewellers Reel Shoot  ·  Lens & Light  ·  Delivery: July 2'),
    bul('June 30 — Avani Brand Identity Delivery  ·  Studio Ink'),
    div(),
    h2('💰 Ad Budget Snapshot — June 2025'),
    bul('Aarni by Sharavani  ·  ₹65,000 budget  ·  ₹27,000 spent  ·  42% utilised  ·  Meta + Google'),
    bul('Beri Jewellers  ·  ₹30,000 budget  ·  ₹22,000 spent  ·  73% utilised  ·  Meta'),
    bul('Gujranwala Jewellers  ·  ₹35,000 budget  ·  ₹14,000 spent  ·  40% utilised  ·  Meta + Google'),
    bul('Atul Jewellers  ·  ₹50,000 budget  ·  ₹28,000 spent  ·  56% utilised  ·  Meta'),
    bul('Luminique  ·  ₹55,000 budget  ·  ₹47,000 spent  ·  85% utilised  ·  ⚠️ Near limit — Meta + Google'),
    bul('Karan Kothari  ·  ₹25,000 budget  ·  ₹0 spent  ·  Draft — not live yet  ·  Meta'),
    div(),
    h2('⚠️ Action Needed'),
    callout('Review these items today and assign/escalate as needed.', '⚠️'),
    bul('🔴 Luminique: Client revision requested — warmer tones across all posts (Vanshika)'),
    bul('🔴 Elmara: Website homepage + website copy both blocked — need to unblock this week'),
    bul('🟡 Beri Jewellers: Reel series round 2 — TL to review before sending to client'),
    bul('🟡 Avani: Brand guide v1 awaiting TL sign-off'),
    bul('🟡 Aarni by Sharavani: June calendar awaiting client approval (submitted June 2)'),
    div(),
    h2('🔗 Quick Access'),
    h3('Client & Operations'),
    bul('Client Hub (database)', u(CH)),
    bul('Workflow Tracker', u(WF)),
    bul('Content Calendar', u(CC)),
    h3('Approvals & Revisions'),
    bul('Approval Log', u(AL)),
    bul('Revision Log', u(RL)),
    h3('Performance & Projects'),
    bul('Ads Tracker', u(AT)),
    bul('Projects Tracker', u(PT)),
    bul('Monthly Reports', u(MR)),
  ]);
  log(`  ✅ Founder Dashboard v2: ${u(dash.id)}`);

  // ── 2. CLIENT OPERATIONS HUB ───────────────────────────────────────────
  log('Building 👥 Client Operations Hub...');
  const hub = await mkPage(GS, '👥 Client Operations Hub', '👥');
  await add(hub.id, [
    callout('One hub for all 10 clients. Each client folder contains: June content calendar (posts + stories), assets & file links, and shoot brief.', '👥'),
    div(),
    h2('How to use'),
    bul('Open a client folder below'),
    bul('📅 Content Calendar — full month plan (posts + stories). SMMs fill this, then hand off to designers.'),
    bul('🗂️ Assets & Files — Drive folder links for raw photos, approved posts, brand assets, videos'),
    bul('📸 Shoot Brief — upcoming and past shoot details, concepts, vendor info'),
    div(),
    h2('Clients'),
  ]);
  log(`  ✅ Hub created: ${u(hub.id)}`);

  // ── 3. CLIENT FOLDERS ─────────────────────────────────────────────────
  const clientOrder = Object.keys(CAL);
  for (const clientName of clientOrder) {
    const d = CAL[clientName];
    log(`  Building folder for ${clientName}...`);

    const clientPage = await mkPage(hub.id, clientName, '📁');
    await add(clientPage.id, [
      callout(`SMM: ${d.smm}  ·  ${clientName}`, '📁'),
      div(),
    ]);

    // ── Content Calendar sub-page ────────────────────────────────────────
    const calPage = await mkPage(clientPage.id, '📅 June 2025 — Content Calendar', '📅');

    if (d.posts.length === 0) {
      // Avani / Elmara — not yet active
      await add(calPage.id, [
        callout(`SMM: ${d.smm}  ·  ${clientName}  ·  June 2025`, '📅'),
        div(),
        callout(d.note || 'Content calendar not yet active for this client.', '⏳'),
      ]);
    } else {
      // Active clients — add posts and stories in two batches
      const postBlocks = [
        callout(`SMM: ${d.smm}  ·  ${clientName}  ·  June 2025  ·  Fill in Hooks, Copy, Brief and update Status as work progresses.`, '📅'),
        div(),
        h2('📝 Posts'),
      ];
      d.posts.forEach(po => postBlocks.push(postBlock(po)));
      await add(calPage.id, postBlocks);

      const storyBlocks = [div(), h2('📖 Stories')];
      d.stories.forEach(s => storyBlocks.push(storyBlock(s)));
      storyBlocks.push(div());
      storyBlocks.push(callout('✅ Once finalists are approved by client, update Status → Approved. Designers pick up Approved items from here.', '✅'));
      await add(calPage.id, storyBlocks);
    }
    log(`    ✅ Calendar: ${u(calPage.id)}`);

    // ── Assets & Files sub-page ──────────────────────────────────────────
    const assetsPage = await mkPage(clientPage.id, '🗂️ Assets & Files', '🗂️');
    await add(assetsPage.id, [
      callout(`All file links for ${clientName}. Paste Google Drive or Dropbox links below as you create folders.`, '🗂️'),
      div(),
      h2('📁 Drive Folders'),
      bul('Raw Photos: [Paste Google Drive link]'),
      bul('Approved Posts: [Paste Google Drive link]'),
      bul('Brand Assets (logo, fonts, guidelines): [Paste link]'),
      bul('Video Files & Reels: [Paste link]'),
      bul('Monthly Reports: [Paste link]'),
      div(),
      h2('🔑 Brand Details'),
      bul(`Instagram Handle: @${clientName.toLowerCase().replace(/\s/g, '').replace(/'/g, '')}`),
      bul(`SMM: ${d.smm}`),
      bul('Brand Colours: [Add hex codes]'),
      bul('Brand Fonts: [Add font names]'),
      bul('Brand Tone: [Add guidelines]'),
      div(),
      h2('📌 Notes'),
      bul('Add any brand-specific notes, do-not-use elements, or recurring references here.'),
    ]);
    log(`    ✅ Assets: ${u(assetsPage.id)}`);

    // ── Shoot Brief sub-page (for clients with shoots) ───────────────────
    const clientShoots = SHOOTS.filter(s => s.brand === clientName);
    if (clientShoots.length > 0) {
      const shootPage = await mkPage(clientPage.id, '📸 Shoot Briefs', '📸');
      const shootBlocks = [
        callout(`All shoot briefs for ${clientName}. SMM to fill brief before confirming with vendor.`, '📸'),
        div(),
      ];
      for (const sh of clientShoots) {
        shootBlocks.push(h3(`${sh.date}  ·  ${sh.type}  ·  ${sh.status}`));
        shootBlocks.push(bul(`Vendor: ${sh.vendor}`));
        shootBlocks.push(bul(`Shoot Date: ${sh.date}  ·  Delivery: ${sh.delivery}`));
        shootBlocks.push(bul(`Location: ${sh.location}`));
        shootBlocks.push(bul(`Concepts: ${sh.concepts.join('  ·  ')}`));
        shootBlocks.push(bul(`Notes: ${sh.notes}`));
        shootBlocks.push(bul('Drive Link (assets): [Paste after delivery]'));
        shootBlocks.push(div());
      }
      await add(shootPage.id, shootBlocks);
      log(`    ✅ Shoots: ${u(shootPage.id)}`);
    }
  }

  // ── 4. PHOTOSHOOTS HUB ────────────────────────────────────────────────
  log('Building 📸 Photoshoots hub...');
  const shootsHub = await mkPage(GS, '📸 Photoshoots', '📸');
  await add(shootsHub.id, [
    callout('All scheduled and past photoshoots across all Gryd Co. clients. Organised by status — Upcoming, Planned, Delivered.', '📸'),
    div(),
    h2('📅 Upcoming Shoots — June 2025'),
  ]);

  const upcoming = SHOOTS.filter(s => s.status === 'Upcoming');
  const planned = SHOOTS.filter(s => s.status === 'Planned');
  const delivered = SHOOTS.filter(s => s.status === 'Delivered');

  const upcomingBlocks = [];
  for (const sh of upcoming) {
    upcomingBlocks.push(toggle(`${sh.brand}  ·  ${sh.type}  ·  ${sh.date}`, [
      bul(`SMM: ${sh.smm}`),
      bul(`Vendor: ${sh.vendor}`),
      bul(`Date: ${sh.date}  ·  Delivery: ${sh.delivery}`),
      bul(`Location: ${sh.location}`),
      bul(`Concepts: ${sh.concepts.join('  ·  ')}`),
      bul(`Notes: ${sh.notes}`),
      bul('Drive Assets: [Paste after delivery]'),
    ]));
  }
  upcomingBlocks.push(div());
  upcomingBlocks.push(h2('📋 Planned Shoots — July onwards'));
  for (const sh of planned) {
    upcomingBlocks.push(toggle(`${sh.brand}  ·  ${sh.type}  ·  ${sh.date}`, [
      bul(`SMM: ${sh.smm}`),
      bul(`Vendor: ${sh.vendor}`),
      bul(`Date: ${sh.date}  ·  Delivery: ${sh.delivery}`),
      bul(`Concepts: ${sh.concepts.join('  ·  ')}`),
      bul(`Notes: ${sh.notes}`),
    ]));
  }
  upcomingBlocks.push(div());
  upcomingBlocks.push(h2('✅ Delivered Shoots'));
  for (const sh of delivered) {
    upcomingBlocks.push(toggle(`${sh.brand}  ·  ${sh.type}  ·  ${sh.date}`, [
      bul(`Vendor: ${sh.vendor}`),
      bul(`Delivery: ${sh.delivery}`),
      bul(`Concepts: ${sh.concepts.join('  ·  ')}`),
      bul(`Notes: ${sh.notes}`),
      bul('Drive Assets: [Paste link]'),
    ]));
  }

  await add(shootsHub.id, upcomingBlocks);
  log(`  ✅ Photoshoots hub: ${u(shootsHub.id)}`);

  // ── 5. WORKFLOW TRACKER GUIDE ─────────────────────────────────────────
  log('Building 📋 Workflow Tracker Guide...');
  const wfGuide = await mkPage(GS, '📋 Workflow Tracker — How to Use', '📋');
  await add(wfGuide.id, [
    callout('Daily tracking source for the team. Every task gets logged here with owner, start, and completion. Manika reviews this each morning.', '📋'),
    div(),
    h2('What to log'),
    bul('Every content task: strategy decks, reel briefs, calendar builds, design files, ad campaigns, reports'),
    bul('One row per task — do not combine multiple tasks into one entry'),
    bul('Update Status in real time as you work through it'),
    div(),
    h2('Properties to fill every day'),
    toggle('Task Name — what exactly you are doing', [bul('Be specific: "June reel brief — Karan Kothari x4" not "Brief"')]),
    toggle('Brand — which client this is for', [bul('Select from the dropdown')]),
    toggle('Owner — who is doing it', [bul('One person per task. If two people are involved, create two rows.')]),
    toggle('Task Type — category of work', [bul('Strategy  ·  Brief  ·  Design  ·  Ads  ·  Reporting  ·  Approval  ·  Revision')]),
    toggle('Status — update this in real time', [
      bul('Not Started → In Progress → Review → Done'),
      bul('Blocked: use when you are stuck and need someone else to act first'),
    ]),
    toggle('Start Date + End Date — when did you begin and when did it get done', [
      bul('Fill Start Date when you pick up the task'),
      bul('Fill End Date (Completed On) when you mark it Done'),
      bul('This tells Manika how long tasks are actually taking — honest tracking only'),
    ]),
    toggle('Due Date — when it needs to be done', [bul('Set by Manika or agreed with the client. Do not change without discussing.')]),
    div(),
    h2('Daily routine'),
    num('Morning: Review your tasks for the day. Update any overnight changes to Status.'),
    num('During the day: Update Status as you move through tasks. Add blockers immediately.'),
    num('End of day: Mark Done tasks with today\'s End Date. Flag anything that will carry over.'),
    div(),
    h2('Rules'),
    bul('Never leave a task In Progress for more than 2 days without an update or a Blocked flag'),
    bul('Blocked tasks get escalated to Manika same day'),
    bul('Done means fully done — not "almost done"'),
    div(),
    bul('→ Open Workflow Tracker database', u(WF)),
  ]);
  log(`  ✅ Workflow guide: ${u(wfGuide.id)}`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   ✅ All pages built!');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`\n🏠 Founder Dashboard v2      → ${u(dash.id)}`);
  console.log(`👥 Client Operations Hub     → ${u(hub.id)}`);
  console.log(`   (contains 10 client folders, each with Calendar + Assets + Shoots)`);
  console.log(`📸 Photoshoots hub           → ${u(shootsHub.id)}`);
  console.log(`📋 Workflow Tracker Guide    → ${u(wfGuide.id)}`);
  console.log('\n📌 NEXT STEPS in Notion:');
  console.log('   1. Move 🏠 Founder Dashboard v2 → Grydco\'s HQ (replace old one)');
  console.log('   2. Move 👥 Client Operations Hub → inside ⚙️ Operations in Grydco\'s HQ');
  console.log('   3. Move 📸 Photoshoots → inside ⚙️ Operations or 🎨 Projects');
  console.log('   4. Move 📋 Workflow Guide → inside ⚙️ Operations');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
