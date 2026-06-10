const https = require('https');
const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) { console.error('Set NOTION_TOKEN first'); process.exit(1); }

const GS = '37b6b847-91e8-8025-99c1-f6185bd0fda7';
const WF = '37b6b847-91e8-81c1-bed2-d9f3afad6390';
const CC = '37b6b847-91e8-81cc-ae0d-ebecf7d139fc';
const AL = '37b6b847-91e8-8153-808b-d51a18994bb0';
const RL = '37b6b847-91e8-8166-800c-dd4518cd5801';
const AT = '37b6b847-91e8-81bb-9922-c856c248ba7d';
const PT = '37b6b847-91e8-8104-a5fc-e550f9d22eb1';
const MR = '37b6b847-91e8-81b2-b76b-c4c7c46f13f0';
const CH = '37b6b847-91e8-8115-9892-d139d7fa0428';

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
const add = (pid, ch) => api('PATCH', `blocks/${pid}/children`, { children: ch });
const h2  = t => ({ type:'heading_2', heading_2:{ rich_text:[{type:'text',text:{content:t}}] } });
const h3  = t => ({ type:'heading_3', heading_3:{ rich_text:[{type:'text',text:{content:t}}] } });
const div = () => ({ type:'divider', divider:{} });
const bul = (t, lk) => ({ type:'bulleted_list_item', bulleted_list_item:{ rich_text:[{type:'text',text: lk?{content:t,link:{url:lk}}:{content:t}}] } });
const num = t => ({ type:'numbered_list_item', numbered_list_item:{ rich_text:[{type:'text',text:{content:t}}] } });
const co  = (t, e) => ({ type:'callout', callout:{ rich_text:[{type:'text',text:{content:t}}], icon:{type:'emoji',emoji:e} } });
const tog = (t, ch) => ({ type:'toggle', toggle:{ rich_text:[{type:'text',text:{content:t}}], children:ch } });
const row = cells => ({ type:'table_row', table_row:{ cells: cells.map(c => [{type:'text',text:{content:String(c)}}]) } });
const tbl = (w, hdr, rows) => ({ type:'table', table:{ table_width:w, has_column_header:hdr, has_row_header:false, children: rows } });

function toISO(dayStr) {
  const mo = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  const [d, m] = dayStr.split(' ');
  return mo[m] ? `2025-${mo[m]}-${String(d).padStart(2,'0')}` : null;
}

const CLIENT_OPTS = [
  {name:'Aarni by Sharavani',color:'purple'},{name:'Atul Jewellers',color:'blue'},
  {name:'Bhagat Jewellers',color:'green'},{name:'Beri Jewellers',color:'orange'},
  {name:'Gujranwala Jewellers',color:'pink'},{name:'Luminique',color:'yellow'},
  {name:'Vidhi Sheth',color:'pink'},{name:'Karan Kothari Jewellers',color:'green'},
  {name:'Avani',color:'red'},{name:'Elmara',color:'gray'},
];

// ── Calendar data ──────────────────────────────────────────────────────────
const CAL = {
  "Karan Kothari Jewellers": { smm:"Vanshika", niche:"Premium Bridal and Heritage Jewellery", ig:"@karankotharijewellers",
    posts:[
      {day:"1 Jun",type:"Reel",intent:"Product highlight",hook:"Product Desire + Visual Impact + Reach",copy:"Every bride remembers the moment the jewellery finally made her feel like a bride. Hand-carved patterns, precious stone accents. Visit the store.",collection:"Bridal Edit",brief:"https://pin.it/3tDnLibw",status:"Scheduled"},
      {day:"2 Jun",type:"Reel",intent:"Campaign launch",hook:"Festive Curiosity + Campaign Awareness + Reach",copy:"Karan Kothari Jewellers presents SHUBH VIVAH — a bridal jewellery experience crafted for the wedding moments your family will remember forever.",collection:"Shubh Vivah",brief:"https://pin.it/6U8w3xqvY",status:"In Design"},
      {day:"4 Jun",type:"Reel",intent:"Engagement",hook:"Heirloom Framing + Emotional Storytelling + Saves",copy:"Wedding guest jewellery essentials you will actually wear. Because repeating outfits is okay. Repeating jewellery styling? Never.",collection:"Guest Edit",brief:"https://pin.it/58r7H7EvM",status:"Brief Pending"},
      {day:"5 Jun",type:"Reel",intent:"Engagement",hook:"Product Desire + Family Legacy + Saves",copy:"The Plain Gold Jewellery Collection — bridal chokers, long haars, bangles and statement sets. Flat 9% Making Charges on Plain Gold.",collection:"Plain Gold",brief:"https://pin.it/7Hv407Zzm",status:"Approved"},
      {day:"8 Jun",type:"Post",intent:"Product highlight",hook:"Heritage + Craftsmanship + Brand Trust",copy:"100 years. One craft. Infinite stories. Karan Kothari Jewellers — since 1924.",collection:"Heritage",brief:"—",status:"Scheduled"},
      {day:"10 Jun",type:"Carousel",intent:"Engagement",hook:"Wedding season essentials — Saves",copy:"Four pieces. Endless combinations. Statement necklace. Stacking bangles. Cocktail ring. Ear cuff.",collection:"Statement Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Product highlight",hook:"Plain gold — everyday luxury + DMs",copy:"Plain gold, pure joy. Shop the collection in-store. Flat 9% making charges this week.",collection:"Plain Gold",brief:"—",status:"Scheduled"},
      {day:"15 Jun",type:"Post",intent:"BTS",hook:"Behind the scenes — curiosity + trust",copy:"This is where it all begins. Behind every piece is hours of craft, care and precision.",collection:"Studio BTS",brief:"—",status:"In Design"},
      {day:"18 Jun",type:"Carousel",intent:"Engagement",hook:"Bride vs guest — relatable + Saves",copy:"What the bride wears. What the guests wear. The rule? There is none. Just Karan Kothari.",collection:"Bridal Edit",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"1 Jun",intent:"Offer",copy:"Flat 9% Making Charges — Today only",status:"Scheduled"},
      {day:"3 Jun",intent:"Product",copy:"New arrivals — Bridal chokers. Come see us.",status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"Poll: Gold or diamonds for your wedding?",status:"Scheduled"},
      {day:"7 Jun",intent:"BTS",copy:"Meet our karigars — watch this",status:"Scheduled"},
      {day:"10 Jun",intent:"Offer",copy:"Weekend special — Visit the store",status:"Scheduled"},
    ]
  },
  "Aarni by Sharavani": { smm:"Tia", niche:"Fine Jewellery — Solitaires and Contemporary", ig:"@aarnibysharavani",
    posts:[
      {day:"5 Jun",type:"Reel",intent:"Brand awareness",hook:"These are not just bangles — Curiosity + Reach",copy:"Hand-forged. Stone-set. Made to be worn for decades. The Aarni Summer Collection is here.",collection:"Summer Collection",brief:"https://drive.google.com/",status:"Posted"},
      {day:"8 Jun",type:"Post",intent:"Product",hook:"One piece. Every occasion. — Versatility + DMs",copy:"From boardroom to wedding mandap — this is the necklace that does it all. Aarni by Sharavani.",collection:"Everyday Luxury",brief:"https://drive.google.com/",status:"Scheduled"},
      {day:"12 Jun",type:"Carousel",intent:"Sales",hook:"The edit you have been waiting for — Saves + DMs",copy:"The gold cuff. The stone drops. The layering set. Shop the Summer Edit.",collection:"Summer Collection",brief:"https://drive.google.com/",status:"In Design"},
      {day:"15 Jun",type:"Reel",intent:"Brand story",hook:"Made by hand. Worn with intent. — Saves",copy:"Every piece at Aarni begins the same way — with a sketch, a story, and a stone. This is how it is made.",collection:"Artisan Series",brief:"—",status:"Brief Pending"},
      {day:"19 Jun",type:"Post",intent:"Community",hook:"Who are you wearing it for? — Saves + Comments",copy:"Your grandmother wore gold differently. Your mother wore it proudly. You wear it on your own terms. Aarni. For every generation.",collection:"Heritage",brief:"—",status:"Brief Pending"},
      {day:"23 Jun",type:"Carousel",intent:"Styling",hook:"How to style solitaires — Saves + Shares",copy:"Morning: solitaire studs. Office: minimal necklace. Evening: stacked rings. Weekend: layered bracelets.",collection:"Styling Guide",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"2 Jun",intent:"Product",copy:"New drop — Summer bangles. Available in-store.",status:"Scheduled"},
      {day:"4 Jun",intent:"Engagement",copy:"This or that: Stack or solo?",status:"Scheduled"},
      {day:"8 Jun",intent:"BTS",copy:"Inside the studio — watch this",status:"Scheduled"},
      {day:"12 Jun",intent:"Offer",copy:"DM us to enquire about the Summer Edit",status:"Scheduled"},
    ]
  },
  "Atul Jewellers": { smm:"Vanshika", niche:"Traditional and Bridal Jewellery", ig:"@atuljewellers",
    posts:[
      {day:"2 Jun",type:"Reel",intent:"Brand",hook:"Bridal season is here. Are you ready? — Reach + DMs",copy:"The bridal collection you have been waiting for is now here. From heavy bridal sets to delicate pieces for every function.",collection:"Bridal 2025",brief:"—",status:"Posted"},
      {day:"5 Jun",type:"Post",intent:"Product",hook:"New arrivals — FOMO + DMs",copy:"Fresh arrivals this week. Over 500 designs across all budgets. Stop by and explore. Mon to Sun, 10AM to 8PM.",collection:"New Arrivals",brief:"—",status:"Scheduled"},
      {day:"9 Jun",type:"Carousel",intent:"Education",hook:"The complete bridal jewellery checklist — Saves",copy:"Bridal necklace. Maang tikka. Earring set. Bangles. Payal. All at Atul Jewellers.",collection:"Bridal Checklist",brief:"—",status:"In Design"},
      {day:"13 Jun",type:"Reel",intent:"BTS",hook:"Heritage meets modern craftsmanship — Trust + Saves",copy:"Our karigars have been crafting jewellery for three generations. Every piece carries that legacy.",collection:"Heritage BTS",brief:"—",status:"Brief Pending"},
      {day:"17 Jun",type:"Post",intent:"Offer",hook:"Wedding season special — book a consultation",copy:"Getting married this season? Book a private consultation at our showroom. Custom designs available.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"21 Jun",type:"Reel",intent:"Engagement",hook:"Before vs after the wedding — relatable + Comments",copy:"Before the wedding: saving for the perfect set. After the wedding: wondering how to store it all. We have both covered.",collection:"Bridal",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"3 Jun",intent:"Product",copy:"New bridal set arrivals — come see us",status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Book a consultation this week",status:"Scheduled"},
      {day:"10 Jun",intent:"BTS",copy:"Inside the workshop — watch this",status:"Brief Pending"},
      {day:"14 Jun",intent:"Engagement",copy:"Quiz: What is your bridal jewellery style?",status:"Brief Pending"},
    ]
  },
  "Bhagat Jewellers": { smm:"Tia", niche:"Classic Jewellery", ig:"@bhagatjewellers",
    posts:[
      {day:"2 Jun",type:"Reel",intent:"Brand",hook:"Classic jewellery for the modern Indian woman — Reach",copy:"Classic gold. Classic craftsmanship. Bhagat Jewellers — where every piece tells a story passed down through generations.",collection:"Classic Collection",brief:"—",status:"In Design"},
      {day:"5 Jun",type:"Post",intent:"Craft",hook:"Crafted with care. Worn for generations. — Trust + Saves",copy:"Our artisans put over 200 hours into every bridal set. Not just jewellery. That is legacy.",collection:"Bridal",brief:"—",status:"Brief Pending"},
      {day:"8 Jun",type:"Carousel",intent:"Education",hook:"Your complete bridal jewellery guide — Saves",copy:"Maang tikka. Necklace. Earrings. Bangles. Everything you need, one place.",collection:"Bridal Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Product",hook:"The piece that goes with everything — DMs",copy:"One necklace. Ten outfits. Zero compromises. Visit us in-store this week.",collection:"Everyday Collection",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Footfall",hook:"Walk in and find your piece",copy:"Walk in. Find your piece. Walk out feeling like royalty. Open 7 days, 10AM to 8PM.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"20 Jun",type:"Carousel",intent:"Styling",hook:"5 jewellery pieces every collection needs — Saves",copy:"Solid bangle set. Versatile necklace. Statement earrings. Cocktail ring. The ear cuff.",collection:"Essentials Edit",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"3 Jun",intent:"Product",copy:"New arrivals in-store this week",status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Weekend special — visit us",status:"Brief Pending"},
      {day:"10 Jun",intent:"Engagement",copy:"Poll: Gold or silver jewellery?",status:"Brief Pending"},
      {day:"14 Jun",intent:"BTS",copy:"Behind the showcase — our artisans",status:"Brief Pending"},
    ]
  },
  "Beri Jewellers": { smm:"Vanshika", niche:"Statement Jewellery", ig:"@berijewellers",
    posts:[
      {day:"1 Jun",type:"Reel",intent:"Brand",hook:"Bold is not a choice. It is a statement. — Reach",copy:"Bold. Unapologetic. Made to be noticed. The Beri Statement Collection — now in-store.",collection:"Statement Collection",brief:"—",status:"In Progress"},
      {day:"4 Jun",type:"Carousel",intent:"Styling",hook:"Stack it. Layer it. Own it. — Saves",copy:"The single bold bangle. The stacked set. The full arm party. Which are you?",collection:"Stack Edit",brief:"—",status:"Brief Pending"},
      {day:"7 Jun",type:"Post",intent:"Product",hook:"New drops you did not know you needed — DMs",copy:"New arrivals just dropped. The cocktail rings you have been waiting for. Shop in-store or DM.",collection:"Cocktail Edit",brief:"—",status:"Brief Pending"},
      {day:"11 Jun",type:"Reel",intent:"Brand story",hook:"Made for the woman who wears what she wants — Comments",copy:"There are no rules here. Just jewellery that makes a statement. Beri Jewellers — for the bold.",collection:"Brand",brief:"—",status:"Brief Pending"},
      {day:"15 Jun",type:"Post",intent:"Product",hook:"One pair of earrings. Every occasion. — DMs",copy:"Statement earrings — the only accessory you need. Shop the collection in-store.",collection:"Earring Edit",brief:"—",status:"Brief Pending"},
      {day:"20 Jun",type:"Reel",intent:"Engagement",hook:"Minimal vs bold — Comments + Saves",copy:"They say less is more. We say more is more. Which side are you on? Drop your answer below.",collection:"Brand",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"2 Jun",intent:"Offer",copy:"New in store — come see us today",status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"This or that: Bold or minimal?",status:"Brief Pending"},
      {day:"9 Jun",intent:"Product",copy:"New drops — cocktail rings",status:"Brief Pending"},
      {day:"13 Jun",intent:"BTS",copy:"Behind the design process",status:"Brief Pending"},
    ]
  },
  "Gujranwala Jewellers": { smm:"Tia", niche:"Heritage Jewellery", ig:"@gujranwalajewellers",
    posts:[
      {day:"1 Jun",type:"Post",intent:"Brand",hook:"A legacy of craft and trust — Brand recall",copy:"Every piece carries the heritage of Gujranwala. A legacy of craft, quality and trust — passed down for generations.",collection:"Heritage Collection",brief:"—",status:"Scheduled"},
      {day:"4 Jun",type:"Reel",intent:"Product",hook:"The gold your family will love — Reach + DMs",copy:"Traditional designs that stand the test of time. Crafted for today's bride. Treasured by generations.",collection:"Bridal",brief:"—",status:"In Design"},
      {day:"8 Jun",type:"Carousel",intent:"Education",hook:"Bridal sets that tell a story — Saves",copy:"The heavy full set. The medium set for functions. Light daily wear. Cocktail pieces. Every bride, every budget.",collection:"Bridal Sets",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"BTS",hook:"Traditional designs. Modern hearts. — Trust + Saves",copy:"Our karigars have been crafting jewellery for over 50 years. This is their story. Watch till the end.",collection:"Artisan BTS",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Footfall",hook:"Book your consultation",copy:"Walk in any day this week and explore our full bridal collection. Custom orders welcome.",collection:"—",brief:"—",status:"Brief Pending"},
      {day:"21 Jun",type:"Carousel",intent:"Engagement",hook:"Then vs now — nostalgia + Saves",copy:"The jewellery our grandmothers wore. Our mothers wore. We wear today. Heritage never goes out of style.",collection:"Heritage",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"3 Jun",intent:"Product",copy:"New bridal set arrivals this week",status:"Scheduled"},
      {day:"6 Jun",intent:"Offer",copy:"Book a consultation — limited slots",status:"Brief Pending"},
      {day:"10 Jun",intent:"Engagement",copy:"Poll: Traditional or fusion bridal?",status:"Brief Pending"},
    ]
  },
  "Luminique": { smm:"Vanshika", niche:"Luxury Jewellery and Lifestyle", ig:"@luminique",
    posts:[
      {day:"1 Jun",type:"Reel",intent:"Brand",hook:"Luxury is a feeling. This is it. — Reach",copy:"Luminique. Crafted for those who know. New season collection — now available. DM to enquire.",collection:"New Season",brief:"—",status:"Scheduled"},
      {day:"4 Jun",type:"Post",intent:"Brand story",hook:"For those who know. — Aspirational + Saves",copy:"Luminique was created for a specific kind of woman. She does not follow trends. She sets them.",collection:"Brand",brief:"—",status:"In Design"},
      {day:"8 Jun",type:"Carousel",intent:"Product",hook:"The luxury edit — June 2025 — Saves + DMs",copy:"The statement necklace. The cocktail ring. The ear cuff. The bracelet stack. Curated luxury, every piece.",collection:"Luxury Edit",brief:"—",status:"Brief Pending"},
      {day:"12 Jun",type:"Reel",intent:"Styling",hook:"How to wear luxury jewellery every day — Saves",copy:"Board meeting to black tie dinner. One collection. Endless occasions. This is how Luminique clients do it.",collection:"Styling Series",brief:"—",status:"Brief Pending"},
      {day:"16 Jun",type:"Post",intent:"Community",hook:"The Luminique woman — identity + Comments",copy:"You do not wear Luminique to be noticed. You wear it because you know the difference.",collection:"Brand",brief:"—",status:"Brief Pending"},
      {day:"22 Jun",type:"Reel",intent:"Campaign",hook:"New season, new light. — Hype + DMs",copy:"Everything new at Luminique this season. Watch this. Then DM us.",collection:"New Season",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"2 Jun",intent:"Product",copy:"New arrivals — Statement collection. DM to enquire.",status:"Scheduled"},
      {day:"5 Jun",intent:"Engagement",copy:"This or that: Gold or platinum?",status:"Brief Pending"},
      {day:"9 Jun",intent:"Offer",copy:"Private viewing this week — book your slot",status:"Brief Pending"},
      {day:"13 Jun",intent:"BTS",copy:"Inside the atelier — watch this",status:"Brief Pending"},
      {day:"17 Jun",intent:"Product",copy:"The piece everyone is asking about this week",status:"Brief Pending"},
    ]
  },
  "Vidhi Sheth": { smm:"Tia", niche:"Contemporary Fine Jewellery", ig:"@vidhisheth",
    posts:[
      {day:"2 Jun",type:"Post",intent:"Brand",hook:"Contemporary fine jewellery for the modern woman",copy:"Fine jewellery designed for women who live fully. Contemporary, thoughtful, made to be worn every single day.",collection:"Everyday Fine",brief:"—",status:"Scheduled"},
      {day:"5 Jun",type:"Reel",intent:"Product",hook:"Your signature piece — DMs",copy:"Every woman has a piece that is unmistakably hers. Find yours in the Vidhi Sheth collection.",collection:"Signature Collection",brief:"—",status:"In Design"},
      {day:"9 Jun",type:"Carousel",intent:"Styling",hook:"The everyday edit — Saves",copy:"Morning coffee ring. Work necklace. Evening earrings. Weekend cuff. Fine jewellery for every moment.",collection:"Everyday Edit",brief:"—",status:"Brief Pending"},
      {day:"13 Jun",type:"Reel",intent:"Brand",hook:"Fine jewellery. Everyday wear. — Saves + Reach",copy:"Fine jewellery does not need a special occasion. It IS the occasion. Shop the everyday collection.",collection:"Everyday Fine",brief:"—",status:"Brief Pending"},
      {day:"17 Jun",type:"Post",intent:"Teaser",hook:"Coming soon — curiosity + follows",copy:"Something new is dropping next week. Your next favourite piece is almost here.",collection:"New Collection",brief:"—",status:"Brief Pending"},
      {day:"24 Jun",type:"Carousel",intent:"Education",hook:"How to care for fine jewellery — Saves",copy:"Storage tips. Cleaning guide. What to avoid. When to get it serviced. From us to you.",collection:"Care Guide",brief:"—",status:"Brief Pending"},
    ],
    stories:[
      {day:"3 Jun",intent:"Product",copy:"New everyday pieces in-store",status:"Scheduled"},
      {day:"7 Jun",intent:"Engagement",copy:"Poll: Rings or necklaces?",status:"Brief Pending"},
      {day:"11 Jun",intent:"BTS",copy:"Design process — watch this",status:"Brief Pending"},
    ]
  },
  "Avani": { smm:"Tia", niche:"Fine Jewellery — Branding Phase", ig:"@avani.jewels", posts:[], stories:[],
    note:"Currently in branding phase with Studio Ink. Brand Identity delivery: June 30. Social media calendar activates July 2025 post brand launch." },
  "Elmara": { smm:"Vanshika", niche:"Luxury Brand — Website Phase", ig:"@elmara", posts:[], stories:[],
    note:"Currently in website build phase with PixelCraft Studio. Go-live: July 15. Social media calendar activates August 2025." },
};

const SHOOTS = [
  {brand:"Aarni by Sharavani",smm:"Tia",type:"Product Shoot",vendor:"Studio Kiran",month:"June 2025",date:"15 Jun",delivery:"20 Jun",dateISO:"2025-06-15",deliveryISO:"2025-06-20",status:"Upcoming",edits:false,location:"Studio, Delhi",concepts:["Solitaire Collection","Summer Bangles","Everyday Luxury Edit"],notes:"Product-only shoot. No models. 3 collections."},
  {brand:"Bhagat Jewellers",smm:"Tia",type:"Lifestyle Shoot",vendor:"Studio Kiran",month:"May 2025",date:"20 May",delivery:"25 May",dateISO:"2025-05-20",deliveryISO:"2025-05-25",status:"Delivered",edits:true,location:"Studio",concepts:["Classic Collection"],notes:"Delivered. Assets in drive folder."},
  {brand:"Vidhi Sheth",smm:"Tia",type:"Product Shoot",vendor:"Lens and Light",month:"June 2025",date:"22 Jun",delivery:"27 Jun",dateISO:"2025-06-22",deliveryISO:"2025-06-27",status:"Upcoming",edits:false,location:"On-site, Hauz Khas",concepts:["Contemporary Line","Daily Wear Edit"],notes:"On-site natural light shoot. Confirm location 3 days prior."},
  {brand:"Karan Kothari Jewellers",smm:"Vanshika",type:"Bridal Shoot",vendor:"Studio Kiran",month:"June 2025",date:"18 Jun",delivery:"22 Jun",dateISO:"2025-06-18",deliveryISO:"2025-06-22",status:"Upcoming",edits:false,location:"Studio, Delhi",concepts:["Bridal Edit","Plain Gold Collection","Shubh Vivah"],notes:"2 models. Heavy bridal + plain gold. 4-hour session."},
  {brand:"Atul Jewellers",smm:"Vanshika",type:"Product Shoot",vendor:"Studio Kiran",month:"June 2025",date:"1 Jun",delivery:"7 Jun",dateISO:"2025-06-01",deliveryISO:"2025-06-07",status:"Delivered",edits:true,location:"Studio",concepts:["Bridal Collection","Heritage Edit"],notes:"Delivered. Assets shared via drive."},
  {brand:"Luminique",smm:"Vanshika",type:"Lifestyle Shoot",vendor:"Lens and Light",month:"June 2025",date:"25 Jun",delivery:"30 Jun",dateISO:"2025-06-25",deliveryISO:"2025-06-30",status:"Upcoming",edits:false,location:"Location TBD",concepts:["New Season Collection","Luxury Lifestyle"],notes:"Lifestyle shoot with model. Confirm venue by June 18."},
  {brand:"Gujranwala Jewellers",smm:"Tia",type:"Product Shoot",vendor:"Studio Kiran",month:"July 2025",date:"10 Jul",delivery:"15 Jul",dateISO:"2025-07-10",deliveryISO:"2025-07-15",status:"Planned",edits:false,location:"Studio",concepts:["Heritage Collection","Bridal Sets"],notes:"Planned for July. Brief to be sent by June 25."},
  {brand:"Beri Jewellers",smm:"Vanshika",type:"Reel Shoot",vendor:"Lens and Light",month:"June 2025",date:"28 Jun",delivery:"2 Jul",dateISO:"2025-06-28",deliveryISO:"2025-07-02",status:"Planned",edits:false,location:"Studio",concepts:["Statement Edit","Reel Series B"],notes:"3 reels. Confirm scripts before booking vendor."},
];

// ── Database creation helpers ──────────────────────────────────────────────

function createCalendarDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '📅' },
    title: [{ type: 'text', text: { content: 'Content Calendar — June 2025' } }],
    properties: {
      'Name':             { title: {} },
      'Date':             { date: {} },
      'Category':         { select: { options: [{name:'Post',color:'blue'},{name:'Story',color:'orange'}] } },
      'Post Type':        { select: { options: [
        {name:'Reel',color:'purple'},{name:'Post',color:'blue'},
        {name:'Carousel',color:'pink'},{name:'Story',color:'orange'},
        {name:'Ad Creative',color:'red'},
      ]}},
      'Intent':           { select: { options: [
        {name:'Brand',color:'blue'},{name:'Brand awareness',color:'blue'},
        {name:'Brand story',color:'purple'},{name:'Product',color:'green'},
        {name:'Product highlight',color:'green'},{name:'Engagement',color:'pink'},
        {name:'Community',color:'pink'},{name:'Styling',color:'yellow'},
        {name:'Education',color:'yellow'},{name:'BTS',color:'gray'},
        {name:'Craft',color:'brown'},{name:'Footfall',color:'orange'},
        {name:'Offer',color:'orange'},{name:'Sales',color:'red'},
        {name:'Campaign',color:'red'},{name:'Campaign launch',color:'red'},
        {name:'Teaser',color:'purple'},
      ]}},
      'Hook / Objective': { rich_text: {} },
      'Image Copy':       { rich_text: {} },
      'Collection':       { rich_text: {} },
      'Brief / Reference':{ url: {} },
      'Status':           { select: { options: [
        {name:'Brief Pending',color:'red'},{name:'In Design',color:'yellow'},
        {name:'Approved',color:'green'},{name:'Scheduled',color:'blue'},
        {name:'Posted',color:'gray'},{name:'In Progress',color:'orange'},
      ]}},
      'SMM':              { select: { options: [{name:'Tia',color:'purple'},{name:'Vanshika',color:'blue'}] } },
    },
  });
}

async function addCalEntry(dbId, smm, e, isStory) {
  const name = isStory
    ? `${e.day} — Story — ${e.intent}`
    : `${e.day} — ${e.type} — ${e.intent}`;
  const props = {
    'Name':      { title: [{ type:'text', text:{ content: name } }] },
    'Category':  { select: { name: isStory ? 'Story' : 'Post' } },
    'Post Type': { select: { name: isStory ? 'Story' : e.type } },
    'Status':    { select: { name: e.status } },
    'SMM':       { select: { name: smm } },
  };
  const iso = toISO(e.day);
  if (iso) props['Date'] = { date: { start: iso } };
  if (e.intent) props['Intent'] = { select: { name: e.intent } };
  if (!isStory) {
    if (e.hook) props['Hook / Objective'] = { rich_text: [{ type:'text', text:{ content: e.hook } }] };
    if (e.copy) props['Image Copy']       = { rich_text: [{ type:'text', text:{ content: e.copy } }] };
    if (e.collection && e.collection !== '—') props['Collection'] = { rich_text: [{ type:'text', text:{ content: e.collection } }] };
    if (e.brief && e.brief !== '—') props['Brief / Reference'] = { url: e.brief };
  } else {
    if (e.copy) props['Image Copy'] = { rich_text: [{ type:'text', text:{ content: e.copy } }] };
  }
  return api('POST', 'pages', {
    parent: { type:'database_id', database_id: dbId },
    icon:   { type:'emoji', emoji: isStory ? '📖' : '📸' },
    properties: props,
  });
}

function createWorkflowDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '✅' },
    title: [{ type: 'text', text: { content: 'Daily Tasks' } }],
    properties: {
      'Task Name':         { title: {} },
      'Assigned To':       { select: { options: [
        {name:'Manika',color:'red'},{name:'Tia',color:'purple'},
        {name:'Vanshika',color:'blue'},{name:'Mahima',color:'pink'},
        {name:'Durga',color:'orange'},{name:'Pratyusha',color:'green'},
      ]}},
      'Assigned By':       { select: { options: [
        {name:'Manika',color:'red'},{name:'Tia',color:'purple'},{name:'Vanshika',color:'blue'},
      ]}},
      'Client':            { select: { options: [...CLIENT_OPTS, {name:'Internal',color:'gray'}] } },
      'Task Type':         { select: { options: [
        {name:'Strategy',color:'blue'},{name:'Brief / Script',color:'purple'},
        {name:'Content Calendar',color:'pink'},{name:'Design',color:'orange'},
        {name:'Caption Writing',color:'yellow'},{name:'Posting',color:'green'},
        {name:'Ads Management',color:'red'},{name:'Client Communication',color:'blue'},
        {name:'Reporting',color:'gray'},{name:'Admin',color:'gray'},
        {name:'Revision',color:'orange'},
      ]}},
      'Status':            { select: { options: [
        {name:'Not Started',color:'gray'},{name:'In Progress',color:'yellow'},
        {name:'Review',color:'blue'},{name:'Done',color:'green'},
        {name:'Blocked',color:'red'},
      ]}},
      'Priority':          { select: { options: [
        {name:'High',color:'red'},{name:'Medium',color:'yellow'},{name:'Low',color:'gray'},
      ]}},
      'Revision Count':    { number: { format: 'number' } },
      'Start Date':        { date: {} },
      'Due Date':          { date: {} },
      'Completed On':      { date: {} },
      'Turnaround (days)': { formula: { expression: 'dateBetween(prop("Completed On"), prop("Start Date"), "days")' } },
      'Notes':             { rich_text: {} },
    },
  });
}

function createInvoiceDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '💰' },
    title: [{ type: 'text', text: { content: 'Invoice and Payment Tracker' } }],
    properties: {
      'Invoice':        { title: {} },
      'Client':         { select: { options: CLIENT_OPTS } },
      'Month':          { select: { options: [
        {name:'May 2025',color:'green'},{name:'June 2025',color:'blue'},
        {name:'July 2025',color:'purple'},{name:'August 2025',color:'orange'},
      ]}},
      'Services':       { rich_text: {} },
      'Amount (Rs)':    { number: { format: 'number' } },
      'Invoice Date':   { date: {} },
      'Due Date':       { date: {} },
      'Payment Status': { select: { options: [
        {name:'Draft',color:'gray'},{name:'Sent',color:'blue'},
        {name:'Paid',color:'green'},{name:'Overdue',color:'red'},
        {name:'Partially Paid',color:'yellow'},
      ]}},
      'Payment Method': { select: { options: [
        {name:'Bank Transfer',color:'blue'},{name:'UPI',color:'green'},
        {name:'Cheque',color:'gray'},{name:'Online',color:'purple'},
      ]}},
      'Notes':          { rich_text: {} },
    },
  });
}

function createMeetingDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '📝' },
    title: [{ type: 'text', text: { content: 'Meeting Notes' } }],
    properties: {
      'Meeting':        { title: {} },
      'Client / Topic': { select: { options: [...CLIENT_OPTS, {name:'Internal',color:'gray'}] } },
      'Date':           { date: {} },
      'Meeting Type':   { select: { options: [
        {name:'Client Call',color:'blue'},{name:'Internal Sync',color:'green'},
        {name:'Strategy Session',color:'purple'},{name:'Shoot Brief',color:'orange'},
        {name:'Review Meeting',color:'pink'},{name:'Onboarding',color:'yellow'},
      ]}},
      'Attendees':      { rich_text: {} },
      'Key Points':     { rich_text: {} },
      'Action Items':   { rich_text: {} },
      'Follow-up Date': { date: {} },
      'Status':         { select: { options: [
        {name:'Notes Pending',color:'red'},{name:'Action Pending',color:'yellow'},
        {name:'Done',color:'green'},
      ]}},
    },
  });
}

function createKPIsDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '📊' },
    title: [{ type: 'text', text: { content: 'Team KPIs' } }],
    properties: {
      'Name':        { title: {} },
      'Team Member': { select: { options: [
        {name:'Tia',color:'purple'},{name:'Vanshika',color:'blue'},
        {name:'Mahima',color:'pink'},{name:'Durga',color:'orange'},
        {name:'Pratyusha',color:'green'},
      ]}},
      'Client':      { select: { options: CLIENT_OPTS } },
      'Metric':      { select: { options: [
        {name:'Posts Published',color:'blue'},{name:'Reels Published',color:'purple'},
        {name:'Carousels Published',color:'pink'},{name:'Stories Published',color:'orange'},
        {name:'Reach',color:'green'},{name:'Impressions',color:'green'},
        {name:'Engagement Rate (%)',color:'yellow'},{name:'Followers Gained',color:'blue'},
        {name:'Ad ROAS',color:'red'},{name:'Link Clicks',color:'orange'},
        {name:'DMs Received',color:'purple'},
      ]}},
      'Month':       { select: { options: [
        {name:'May 2025',color:'green'},{name:'June 2025',color:'blue'},{name:'July 2025',color:'purple'},
      ]}},
      'Target':      { number: { format: 'number' } },
      'Actual':      { number: { format: 'number' } },
      'Status':      { select: { options: [
        {name:'On Track',color:'green'},{name:'Behind',color:'red'},
        {name:'Exceeded',color:'blue'},{name:'N/A',color:'gray'},
      ]}},
    },
  });
}

function createShootsDB(parentId) {
  return api('POST', 'databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: '📸' },
    title: [{ type: 'text', text: { content: 'Photoshoots Tracker' } }],
    properties: {
      'Name':           { title: {} },
      'Client':         { select: { options: CLIENT_OPTS } },
      'Month':          { select: { options: [{name:'May 2025',color:'green'},{name:'June 2025',color:'blue'},{name:'July 2025',color:'purple'}] } },
      'Shoot Type':     { select: { options: [{name:'Product Shoot',color:'blue'},{name:'Lifestyle Shoot',color:'green'},{name:'Bridal Shoot',color:'pink'},{name:'Reel Shoot',color:'purple'}] } },
      'Vendor':         { select: { options: [{name:'Studio Kiran',color:'orange'},{name:'Lens and Light',color:'blue'},{name:'Other',color:'gray'}] } },
      'Status':         { select: { options: [{name:'Planned',color:'gray'},{name:'Upcoming',color:'yellow'},{name:'Delivered',color:'green'},{name:'Cancelled',color:'red'}] } },
      'SMM':            { select: { options: [{name:'Tia',color:'purple'},{name:'Vanshika',color:'blue'}] } },
      'Shoot Date':     { date: {} },
      'Delivery Date':  { date: {} },
      'Edits Received': { checkbox: {} },
      'Drive Link':     { url: {} },
      'Location':       { rich_text: {} },
      'Concepts':       { rich_text: {} },
      'Notes':          { rich_text: {} },
    },
  });
}

function addShootRow(dbId, s) {
  const props = {
    'Name':           { title: [{ type:'text', text:{ content:`${s.brand} — ${s.type} — ${s.month}` } }] },
    'Client':         { select: { name: s.brand } },
    'Month':          { select: { name: s.month } },
    'Shoot Type':     { select: { name: s.type } },
    'Vendor':         { select: { name: s.vendor } },
    'Status':         { select: { name: s.status } },
    'SMM':            { select: { name: s.smm } },
    'Edits Received': { checkbox: s.edits },
    'Location':       { rich_text: [{ type:'text', text:{ content: s.location } }] },
    'Concepts':       { rich_text: [{ type:'text', text:{ content: s.concepts.join(' · ') } }] },
    'Notes':          { rich_text: [{ type:'text', text:{ content: s.notes } }] },
  };
  if (s.dateISO)     props['Shoot Date']    = { date: { start: s.dateISO } };
  if (s.deliveryISO) props['Delivery Date'] = { date: { start: s.deliveryISO } };
  return api('POST', 'pages', { parent: { type:'database_id', database_id: dbId }, icon:{ type:'emoji', emoji:'📸' }, properties: props });
}

// ── Content blocks ─────────────────────────────────────────────────────────

function strategyBlocks(name, smm) {
  return [
    co(`Prepared by ${smm}  |  Reviewed by Manika  |  Finalised before calendar launch  |  One strategy doc per month.`, '🎯'),
    div(),
    h2('Monthly Objectives'),
    bul('Primary goal: [e.g. Increase reach to X / Drive X DMs / Grow followers by X]'),
    bul('Secondary goal: [e.g. Build brand authority / Push new collection launch / Drive footfall]'),
    bul('Reach target: ___  |  Engagement rate: ___%  |  New followers: ___  |  DMs: ___'),
    div(),
    h2('AIDA Framework'),
    h3('A — Attention  (how do we stop the scroll?)'),
    bul('First-frame visual: [describe the opening image or frame — colour, subject, movement]'),
    bul('On-screen text / hook copy: [the first line the viewer reads]'),
    bul('Reel first 3 seconds: [pattern interrupt / bold statement / question / visual hook]'),
    h3('I — Interest  (why should they keep watching?)'),
    bul('Content angle this month: [the interesting angle that gives this brand a fresh perspective]'),
    bul('Storytelling style: [ ] Hero story  [ ] Problem to Solution  [ ] Before and After  [ ] Aspirational  [ ] Educational'),
    bul('Key emotional trigger: [ ] Nostalgia  [ ] Aspiration  [ ] FOMO  [ ] Belonging  [ ] Pride  [ ] Curiosity'),
    h3('D — Desire  (what makes them want it?)'),
    bul('USP to highlight this month: [one unique thing about this brand to lead with]'),
    bul('Social proof to use: [ ] Heritage or legacy  [ ] Craftsmanship BTS  [ ] Testimonials  [ ] Awards'),
    bul('Aspirational positioning: [how should the viewer feel — loved / elevated / proud / bold]'),
    h3('A — Action  (what do we want them to do?)'),
    bul('Primary CTA: [ ] DM us  [ ] Visit the store  [ ] Call to book  [ ] Link in bio  [ ] Save this post'),
    bul('Secondary CTA: [ ] Comment below  [ ] Share to stories  [ ] Tag a friend'),
    bul('Offer or lead magnet this month: [see Lead Magnets section below]'),
    div(),
    h2('Content Pillars — focus per pillar this month'),
    bul('Pillar 1 — Product Showcase: [which collections or pieces to feature — be specific]'),
    bul('Pillar 2 — Brand Story: [what story angle — artisans / founder / legacy / craftsmanship]'),
    bul('Pillar 3 — Styling and Inspiration: [how-to-style, occasion dressing, outfit pairing]'),
    bul('Pillar 4 — Behind the Scenes: [studio, making process, karigars — what BTS is available]'),
    bul('Pillar 5 — Education: [what to teach — caring for jewellery / buying guide / trend education]'),
    bul('Pillar 6 — Community and Engagement: [polls, relatable moments, questions, UGC prompts]'),
    bul('Pillar ratio this month: [ ] More product  [ ] More brand  [ ] Balanced'),
    div(),
    h2('Monthly Campaigns'),
    tog('Campaign 1 — [Campaign name]', [
      bul('Dates: [start] to [end]'),
      bul('Content types: [ ] Reels  [ ] Posts  [ ] Carousels  [ ] Stories  [ ] Ad creatives'),
      bul('Ad support: [ ] Meta  [ ] Google  [ ] No ads'),
      bul('Goal: [ ] Awareness  [ ] DMs  [ ] Sales  [ ] Followers'),
      bul('Key message (one line): [what is this campaign saying]'),
    ]),
    tog('Campaign 2 — [Add if applicable]', [
      bul('Dates: [start] to [end]'),
      bul('Content types: [ ] Reels  [ ] Posts  [ ] Stories'),
      bul('Ad support: [ ] Yes  [ ] No'),
      bul('Goal: [awareness / sales / DMs]'),
      bul('Key message: [one line]'),
    ]),
    div(),
    h2('Lead Magnets'),
    bul('Lead magnet 1: [e.g. Free styling consultation — DM to book]'),
    bul('Lead magnet 2: [e.g. Making charge offer — limited time]'),
    bul('Lead magnet 3: [e.g. Custom order inquiry / New collection preview — DM for early access]'),
    bul('Story CTA: [specific DM prompt or action for stories this month]'),
    div(),
    h2('Hashtag Strategy'),
    bul(`Brand hashtags: #${name.toLowerCase().replace(/\s/g,'').replace(/'/g,'')} #[collection name] #[campaign name]`),
    bul('Industry: #jewellery #indianjewellery #jewellerylovers #handcraftedjewellery'),
    bul('Niche: [specific — e.g. #bridaljewellery #finejewellery #luxuryjewellery #statementjewellery]'),
    bul('Community: #weddingseason #bridesofinstagram #indianbride #jewelleryofinstagram'),
    bul('Location: #delhi #delhijewellery #[city if applicable]'),
    bul('Trending this month: [add 2-3 currently trending hashtags — check weekly]'),
    div(),
    h2('Competitor and Trend Notes'),
    bul('What competitors are doing that is working this month:'),
    bul('Content format or audio to test:'),
    bul('What NOT to do — oversaturated or off-brand in the market right now:'),
    div(),
    h2('Sign-off'),
    bul('SMM prepared: _______ on _______'),
    bul('Team Lead reviewed: Manika on _______'),
    bul('Client briefed on monthly direction: [ ] Yes  [ ] No'),
  ];
}

function sopBlocks(name, d) {
  return [
    co(`Standard operating procedures for ${name}. Fill all sections before first content delivery. Updated monthly.`, '📋'),
    div(),
    h2('Client Overview'),
    bul(`SMM Owner: ${d.smm}`),
    bul(`Niche: ${d.niche}`),
    bul(`Instagram Handle: ${d.ig}`),
    bul('Services: —'),
    bul('Retainer Amount: Rs —'),
    bul('Client Since: —'),
    div(),
    h2('Contact Information'),
    bul('Client Name: —'),
    bul('Phone: —'),
    bul('Email: —'),
    bul('WhatsApp: —'),
    bul('Best Time to Reach: —'),
    bul('Preferred Mode: [ ] WhatsApp  [ ] Email  [ ] Phone'),
    div(),
    h2('Posting Schedule'),
    bul('Weekly reels: —  |  Carousels: —  |  Static posts: —'),
    bul('Story frequency: — per day'),
    bul('Best posting times: —'),
    bul('Blackout dates or restrictions: —'),
    div(),
    h2('Approval Process'),
    bul('Who approves content: —'),
    bul('Turnaround time expected: — hours'),
    bul('Revision rounds included in retainer: —'),
    bul('Approval channel: [ ] WhatsApp  [ ] Email  [ ] Notion comment'),
    bul('If no response in 24 hours: [escalate to Manika / post as approved]'),
    div(),
    h2('Brand Guidelines'),
    bul('Primary colour (hex): —'),
    bul('Secondary colour (hex): —'),
    bul('Fonts — primary and secondary: —'),
    bul('Watermark: [ ] Yes  [ ] No  — placement: —'),
    bul('Caption language: [ ] English  [ ] Hindi  [ ] Hinglish'),
    bul('Tone of voice: —'),
    bul('Do: —'),
    bul('Do not: —'),
    div(),
    h2('Credentials and Access'),
    bul('Instagram login: See shared credentials document'),
    bul('Facebook Business Manager: See shared credentials document'),
    bul('Drive folder link: [Paste link]'),
    bul('Ad account access: [ ] Yes  [ ] No'),
    div(),
    h2('Monthly Retainer Scope'),
    bul('Deliverables: — posts  — reels  — carousels  — stories'),
    bul('Extras billed separately: [ ] Yes  [ ] No'),
    bul('Reporting cadence: [ ] Weekly  [ ] Monthly  [ ] On demand'),
    div(),
    h2('Key Campaigns and Annual Events'),
    tog('Campaign 1 — [Name]', [
      bul('Date: —'),
      bul('Goal: —'),
      bul('Deliverables: —'),
    ]),
    tog('Campaign 2 — [Add if applicable]', [
      bul('Date: —'),
      bul('Goal: —'),
      bul('Deliverables: —'),
    ]),
    div(),
    h2('Notes'),
    bul('Additional instructions, restrictions, or special agreements:'),
    bul('—'),
  ];
}

function assetsBlocks(name) {
  return [
    co(`File links and brand references for ${name}. Paste Drive links as you create folders. Keep updated every month.`, '🗂️'),
    div(),
    h2('Drive Folders — paste links here'),
    bul('Raw Photos (current month): [Paste Google Drive link]'),
    bul('Approved Posts — ready for upload: [Paste link]'),
    bul('Brand Assets (logo, fonts, colours, guidelines): [Paste link]'),
    bul('Video Files and Reels: [Paste link]'),
    bul('Monthly Reports: [Paste link]'),
    div(),
    h2('Brand Reference'),
    bul('Instagram Handle: [handle]'),
    bul('Brand Colours (hex): [e.g. #C5A028, #1A1A1A, #F5F0E8]'),
    bul('Brand Fonts: [Primary font · Secondary font]'),
    bul('Brand Tone: [e.g. Aspirational, warm, trustworthy]'),
    bul('Watermark placement: [bottom right / bottom centre / none]'),
    bul('Do-not-use elements: [anything the client has said to avoid]'),
    div(),
    h2('Posting and Contact'),
    bul('Posting schedule: [e.g. Mon / Wed / Fri + daily stories]'),
    bul('Caption language: [ ] English  [ ] Hindi  [ ] Hinglish  [ ] Mix'),
    bul('Client contact for approvals: [Name · WhatsApp number]'),
    bul('Other notes:'),
  ];
}

async function addInvoiceSamples(dbId) {
  await api('POST', 'pages', {
    parent: { type:'database_id', database_id: dbId },
    icon: { type:'emoji', emoji:'✅' },
    properties: {
      'Invoice':        { title: [{ type:'text', text:{ content:'GC-MAY-001 — Luminique' } }] },
      'Client':         { select: { name:'Luminique' } },
      'Month':          { select: { name:'May 2025' } },
      'Services':       { rich_text: [{ type:'text', text:{ content:'SMM + Ads + Branding' } }] },
      'Amount (Rs)':    { number: 55000 },
      'Invoice Date':   { date: { start:'2025-05-01' } },
      'Due Date':       { date: { start:'2025-05-10' } },
      'Payment Status': { select: { name:'Paid' } },
      'Payment Method': { select: { name:'Bank Transfer' } },
      'Notes':          { rich_text: [{ type:'text', text:{ content:'Received May 8. NEFT ref: GRD/0508. Replace with actual invoice ref.' } }] },
    },
  });
  await api('POST', 'pages', {
    parent: { type:'database_id', database_id: dbId },
    icon: { type:'emoji', emoji:'📤' },
    properties: {
      'Invoice':        { title: [{ type:'text', text:{ content:'GC-JUN-001 — Aarni by Sharavani' } }] },
      'Client':         { select: { name:'Aarni by Sharavani' } },
      'Month':          { select: { name:'June 2025' } },
      'Services':       { rich_text: [{ type:'text', text:{ content:'SMM + Meta Ads' } }] },
      'Amount (Rs)':    { number: 65000 },
      'Invoice Date':   { date: { start:'2025-06-01' } },
      'Due Date':       { date: { start:'2025-06-10' } },
      'Payment Status': { select: { name:'Sent' } },
      'Payment Method': { select: { name:'Bank Transfer' } },
      'Notes':          { rich_text: [{ type:'text', text:{ content:'Invoice sent via email June 1. Follow up by June 8 if not confirmed.' } }] },
    },
  });
}

async function addMeetingSample(dbId) {
  await api('POST', 'pages', {
    parent: { type:'database_id', database_id: dbId },
    icon: { type:'emoji', emoji:'📞' },
    properties: {
      'Meeting':        { title: [{ type:'text', text:{ content:'Jun 3 — Aarni by Sharavani — Monthly Review' } }] },
      'Client / Topic': { select: { name:'Aarni by Sharavani' } },
      'Date':           { date: { start:'2025-06-03' } },
      'Meeting Type':   { select: { name:'Client Call' } },
      'Attendees':      { rich_text: [{ type:'text', text:{ content:'Tia, Sharavani (client)' } }] },
      'Key Points':     { rich_text: [{ type:'text', text:{ content:'June calendar approved. Client wants more lifestyle reels over product close-ups. Product shoot confirmed June 15 with Studio Kiran.' } }] },
      'Action Items':   { rich_text: [{ type:'text', text:{ content:'1. Tia to update 2 reel briefs to lifestyle angle by June 5.  2. Confirm Studio Kiran booking for June 15.' } }] },
      'Follow-up Date': { date: { start:'2025-06-07' } },
      'Status':         { select: { name:'Action Pending' } },
    },
  });
}

async function addWorkflowSamples(dbId) {
  const tasks = [
    // TL -> SMM: strategy tasks
    { name:'June strategy — Aarni by Sharavani', to:'Tia', by:'Manika', client:'Aarni by Sharavani',
      type:'Strategy', status:'In Progress', priority:'High',
      start:'2025-06-01', due:'2025-06-03',
      notes:'Strategy must be finalised before calendar build. AIDA and pillars section done. Campaigns pending.' },
    { name:'June strategy — Gujranwala Jewellers', to:'Tia', by:'Manika', client:'Gujranwala Jewellers',
      type:'Strategy', status:'Done', priority:'High',
      start:'2025-05-30', due:'2025-06-02', done:'2025-06-01', revisions:0,
      notes:'Approved by Manika. Shared with client for direction briefing.' },

    // TL -> SMM: brief tasks
    { name:'Reel brief x3 — Luminique New Season', to:'Vanshika', by:'Manika', client:'Luminique',
      type:'Brief / Script', status:'Review', priority:'High',
      start:'2025-06-02', due:'2025-06-04', revisions:1,
      notes:'Revision 1 done — luxury tone updated, aspirational framing added. Sent to Manika for sign-off.' },

    // SMM -> Designer: design tasks
    { name:'4 static posts — Bhagat Jewellers June', to:'Mahima', by:'Tia', client:'Bhagat Jewellers',
      type:'Design', status:'Not Started', priority:'Medium',
      due:'2025-06-07',
      notes:'Briefs ready in client folder. Pick up after Luminique posts are complete.' },
    { name:'Beri Statement Collection — Reel edit 1', to:'Durga', by:'Vanshika', client:'Beri Jewellers',
      type:'Design', status:'In Progress', priority:'High',
      start:'2025-06-03', due:'2025-06-06',
      notes:'Music: trending audio from brief. Bold cuts, fast-paced edit. Export 9:16 + 4:5.' },
    { name:'Karan Kothari — Bridal carousel design', to:'Mahima', by:'Vanshika', client:'Karan Kothari Jewellers',
      type:'Design', status:'Review', priority:'Medium',
      start:'2025-06-03', due:'2025-06-06', revisions:1,
      notes:'Revision 1: client requested gold tones, reduced text overlay. Resubmitted June 4.' },

    // TL -> Ads: campaign management
    { name:'Luminique ad spend review — June pacing', to:'Pratyusha', by:'Manika', client:'Luminique',
      type:'Ads Management', status:'Blocked', priority:'High',
      start:'2025-06-02', due:'2025-06-04',
      notes:'Blocked — Meta Ads Manager access restricted. Requested from client June 2. Follow up needed.' },

    // Posting + reporting
    { name:'Post live — Aarni June 5 Reel', to:'Tia', by:'Tia', client:'Aarni by Sharavani',
      type:'Posting', status:'Done', priority:'High',
      start:'2025-06-05', due:'2025-06-05', done:'2025-06-05',
      notes:'Posted 6 PM. Reached 8K views in first 2 hours. Scheduled story follow-up for next day.' },
    { name:'Vidhi Sheth — June monthly report', to:'Tia', by:'Manika', client:'Vidhi Sheth',
      type:'Reporting', status:'Not Started', priority:'Low',
      due:'2025-06-30',
      notes:'Pull data from Meta Insights at month end. Use June 2025 report template.' },

    // TL internal: client communication
    { name:'Avani brand guide v1 — TL sign-off', to:'Manika', by:'Manika', client:'Avani',
      type:'Client Communication', status:'In Progress', priority:'High',
      start:'2025-06-03', due:'2025-06-05',
      notes:'Brand guide received from Studio Ink. Review and send approval or revisions to Tia by June 5.' },
  ];

  for (const t of tasks) {
    const emoji = {Done:'✅', Blocked:'🚫', Review:'👀', 'In Progress':'🔄', 'Not Started':'⬜'}[t.status] || '🔄';
    const props = {
      'Task Name':   { title: [{ type:'text', text:{ content: t.name } }] },
      'Assigned To': { select: { name: t.to } },
      'Assigned By': { select: { name: t.by } },
      'Client':      { select: { name: t.client } },
      'Task Type':   { select: { name: t.type } },
      'Status':      { select: { name: t.status } },
      'Priority':    { select: { name: t.priority } },
      'Notes':       { rich_text: [{ type:'text', text:{ content: t.notes } }] },
    };
    if (t.start)                   props['Start Date']     = { date: { start: t.start } };
    if (t.due)                     props['Due Date']       = { date: { start: t.due } };
    if (t.done)                    props['Completed On']   = { date: { start: t.done } };
    if (t.revisions !== undefined) props['Revision Count'] = { number: t.revisions };
    await api('POST', 'pages', {
      parent: { type:'database_id', database_id: dbId },
      icon:   { type:'emoji', emoji },
      properties: props,
    });
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {

  // ── STEP 0: CLEAN ─────────────────────────────────────────────────────────
  log('Cleaning up Getting Started...');
  let cursor; let toArchive = [];
  do {
    const path = `blocks/${GS}/children?page_size=100${cursor ? '&start_cursor=' + cursor : ''}`;
    const res = await api('GET', path);
    toArchive = toArchive.concat((res.results || []).filter(b => b.type === 'child_page'));
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  log(`  Found ${toArchive.length} pages to archive`);
  for (const pg of toArchive) {
    try { await api('PATCH', `pages/${pg.id}`, { archived: true }); log(`  Archived: "${pg.child_page?.title || pg.id}"`); }
    catch (e) { log(`  Skipped: ${e.message.slice(0, 60)}`); }
  }
  log('  Clean. Building now...\n');

  // ── STEP 1: FOUNDER DASHBOARD ────────────────────────────────────────────
  log('1/7  Founder Dashboard...');
  const dash = await mkPage(GS, '🏠 Founder Dashboard', '🏠');
  await add(dash.id, [
    co('Central command for Gryd Co. — client health, team workload, ad performance, deadlines, and action items. Updated by Manika daily.', '🏠'),
    div(),
    h2('Client Overview — June 2025'),
    tbl(5, true, [
      row(['Client','SMM','Services','Ad Budget / mo','Status']),
      row(['Aarni by Sharavani','Tia','SMM + Ads','Rs 65,000','Active']),
      row(['Atul Jewellers','Vanshika','SMM + Ads + Branding','Rs 50,000','Active']),
      row(['Bhagat Jewellers','Tia','SMM only','—','Active']),
      row(['Beri Jewellers','Vanshika','SMM + Ads','Rs 30,000','Active']),
      row(['Gujranwala Jewellers','Tia','SMM + Ads','Rs 35,000','Active']),
      row(['Luminique','Vanshika','SMM + Ads + Branding','Rs 55,000','Active']),
      row(['Vidhi Sheth','Tia','SMM only','—','Active']),
      row(['Karan Kothari Jewellers','Vanshika','SMM + Ads','Rs 25,000','Active']),
      row(['Avani','Tia','Branding','—','Brand launch: June 30']),
      row(['Elmara','Vanshika','Website','—','Website: July 15']),
    ]),
    div(),
    h2('Ad Budget Snapshot — June 2025'),
    tbl(5, true, [
      row(['Client','Budget','Spent','Remaining','Note']),
      row(['Aarni by Sharavani','Rs 65,000','Rs 27,000','Rs 38,000','42% used']),
      row(['Beri Jewellers','Rs 30,000','Rs 22,000','Rs 8,000','73% — watch']),
      row(['Gujranwala Jewellers','Rs 35,000','Rs 14,000','Rs 21,000','40% used']),
      row(['Atul Jewellers','Rs 50,000','Rs 28,000','Rs 22,000','56% used']),
      row(['Luminique','Rs 55,000','Rs 47,000','Rs 8,000','85% — near limit']),
      row(['Karan Kothari','Rs 25,000','Rs 0','Rs 25,000','Draft — not live']),
    ]),
    div(),
    h2('June Deadlines'),
    tbl(4, true, [
      row(['Date','Deliverable','Client','Owner']),
      row(['June 15','Product Shoot','Aarni by Sharavani','Tia']),
      row(['June 18','Bridal Shoot','Karan Kothari Jewellers','Vanshika']),
      row(['June 22','Product Shoot','Vidhi Sheth','Tia']),
      row(['June 25','Lifestyle Shoot','Luminique','Vanshika']),
      row(['June 28','Reel Shoot','Beri Jewellers','Vanshika']),
      row(['June 30','Brand Identity Delivery','Avani — Studio Ink','Tia']),
      row(['July 15','Website Go-Live','Elmara — PixelCraft','Vanshika']),
    ]),
    div(),
    h2('Action Needed'),
    co('Review these items today and assign or escalate.', '⚠️'),
    bul('Luminique — ad budget 85% used, 2 weeks left in June. Pratyusha to review pacing.'),
    bul('Elmara — website homepage and copy both Blocked. Unblock before June 14.'),
    bul('Beri Jewellers — Reel Series round 2 pending TL review. Manika to review today.'),
    bul('Avani — Brand guide v1 pending TL sign-off. Manika to review and send to client.'),
    bul('Aarni by Sharavani — June calendar pending client approval since June 2.'),
    bul('Luminique — revision: warmer tones across all posts. Vanshika in progress.'),
    div(),
    h2('Quick Access'),
    bul('Workflow Tracker', u(WF)),
    bul('Content Calendar', u(CC)),
    bul('Client Hub', u(CH)),
    bul('Approval Log', u(AL)),
    bul('Revision Log', u(RL)),
    bul('Ads Tracker', u(AT)),
    bul('Projects Tracker', u(PT)),
    bul('Monthly Reports', u(MR)),
  ]);
  log(`  done → ${u(dash.id)}`);

  // ── STEP 2: CLIENT OPERATIONS HUB ────────────────────────────────────────
  log('2/7  Client Operations Hub...');
  const hub = await mkPage(GS, '👥 Client Operations Hub', '👥');
  await add(hub.id, [
    co('10 client folders — content calendar database (with dropdowns and colour-coded status), strategy, SOP, assets, and shoot briefs.', '👥'),
    div(),
    h2('How to use'),
    num('SMM opens their client folder at the start of each month'),
    num('Fill Strategy first — AIDA, pillars, campaigns, lead magnets, hashtags. Get Manika sign-off.'),
    num('Add Content Calendar entries — one row per post or story. Fill all fields.'),
    num('Hand off to designers when items reach Brief Pending or Approved'),
    num('Update Status in real time — designers filter by Approved to pick up tasks'),
    div(),
  ]);

  for (const [name, d] of Object.entries(CAL)) {
    log(`  [${name}]`);
    const clientPg = await mkPage(hub.id, name, '📁');
    await add(clientPg.id, [co(`SMM: ${d.smm}  |  ${d.niche}  |  ${d.ig}`, '📁'), div()]);

    if (!d.posts.length) {
      const calNote = await mkPage(clientPg.id, '📅 June 2025 — Content Calendar', '📅');
      await add(calNote.id, [
        co(`SMM: ${d.smm}  |  ${name}  |  June 2025`, '📅'), div(),
        co(d.note, '⏳'),
        bul('Create the calendar database here when the brand goes live.'),
      ]);
    } else {
      const calDb = await createCalendarDB(clientPg.id);
      for (const p of d.posts)   await addCalEntry(calDb.id, d.smm, p, false);
      for (const s of d.stories) await addCalEntry(calDb.id, d.smm, s, true);
      log(`    calendar: ${d.posts.length} posts + ${d.stories.length} stories`);
    }

    const strat = await mkPage(clientPg.id, '🎯 June 2025 — Strategy', '🎯');
    await add(strat.id, strategyBlocks(name, d.smm));

    const sop = await mkPage(clientPg.id, '📋 Client SOP', '📋');
    await add(sop.id, sopBlocks(name, d));

    const assets = await mkPage(clientPg.id, '🗂️ Assets and Files', '🗂️');
    await add(assets.id, assetsBlocks(name));

    const clientShoots = SHOOTS.filter(s => s.brand === name);
    if (clientShoots.length) {
      const shootPg = await mkPage(clientPg.id, '📸 Shoot Briefs', '📸');
      const sb = [co(`Shoot briefs for ${name}. Filled by SMM before confirming with vendor.`, '📸'), div()];
      for (const sh of clientShoots) {
        sb.push(tog(`${sh.date}  |  ${sh.type}  |  ${sh.vendor}  |  ${sh.status}`, [
          bul(`Shoot Date: ${sh.date}  |  Delivery: ${sh.delivery}`),
          bul(`Location: ${sh.location}`),
          bul(`Concepts: ${sh.concepts.join('  |  ')}`),
          bul(`Notes: ${sh.notes}`),
          bul(`Edits received: ${sh.edits ? 'Yes' : 'Pending'}`),
          bul('Drive Link: [Paste after delivery]'),
        ]));
      }
      await add(shootPg.id, sb);
    }
    log(`    done`);
  }
  log(`  done → ${u(hub.id)}`);

  // ── STEP 3: PHOTOSHOOTS ──────────────────────────────────────────────────
  log('3/7  Photoshoots...');
  const shootsParent = await mkPage(GS, '📸 Photoshoots', '📸');
  // DB first — appears as first content block
  const shootsDb = await createShootsDB(shootsParent.id);
  for (const s of SHOOTS) await addShootRow(shootsDb.id, s);
  // Brief note after the database
  await add(shootsParent.id, [co('Filter by Client, Month, Status or Vendor. Monthly summary is in the sub-page below.', 'ℹ️')]);
  // Monthly summary goes in a sub-page
  const shootsSummary = await mkPage(shootsParent.id, '📋 Monthly Summary', '📋');
  await add(shootsSummary.id, [
    co('Quick-reference shoot summary by month.', '📋'),
    div(),
    h2('June 2025'),
    tbl(5, true, [
      row(['Client','Type','Shoot Date','Delivery','Status']),
      ...SHOOTS.filter(s => s.month === 'June 2025').map(s =>
        row([s.brand, s.type, s.date, s.delivery, s.status + (s.edits ? ' — Edits received' : '')])),
    ]),
    div(),
    h2('May 2025'),
    tbl(5, true, [
      row(['Client','Type','Shoot Date','Delivery','Edits Received']),
      ...SHOOTS.filter(s => s.month === 'May 2025').map(s =>
        row([s.brand, s.type, s.date, s.delivery, s.edits ? 'Yes' : 'Pending'])),
    ]),
    div(),
    h2('July 2025 — Planned'),
    tbl(4, true, [
      row(['Client','Type','Planned Date','Notes']),
      ...SHOOTS.filter(s => s.month === 'July 2025').map(s =>
        row([s.brand, s.type, s.date, s.notes])),
    ]),
    div(),
  ]);
  log(`  done → ${u(shootsParent.id)}`);

  // ── STEP 4: WORKFLOW TRACKER ─────────────────────────────────────────────
  log('4/7  Workflow Tracker...');
  const wfParent = await mkPage(GS, '🔄 Workflow Tracker', '🔄');
  // DB first — the main content
  const wfDb = await createWorkflowDB(wfParent.id);
  await addWorkflowSamples(wfDb.id);
  log(`  10 demo tasks added`);
  // Brief note below DB
  await add(wfParent.id, [
    co('Assign tasks via Assigned By + Assigned To. Turnaround days auto-calculate when Completed On is filled. Guide is in the sub-page below.', 'ℹ️'),
  ]);
  // Guide as sub-page
  const wfGuide = await mkPage(wfParent.id, '📖 How to Fill the Tracker', '📖');
  await add(wfGuide.id, [
    co('Reference guide for the Daily Tasks database.', '📖'),
    div(),
    h2('Properties — what to fill'),
    tbl(3, true, [
      row(['Property','What to fill','Why it matters']),
      row(['Task Name','Be specific: "June reel brief — KK x4" not just "Brief"','Manika needs to know exactly what is being done']),
      row(['Assigned To','One person only. Two people = two rows.','Individual accountability']),
      row(['Assigned By','Who created or delegated this task','Tracks TL to SMM to Designer chain']),
      row(['Client','The client or Internal','Tracks per-client workload']),
      row(['Task Type','Select from dropdown','Shows where time is going']),
      row(['Status','Update from Not Started to Done as task progresses','Live view for Manika']),
      row(['Priority','High / Medium / Low — Manika sets for critical items','Helps team prioritise']),
      row(['Revision Count','Increment each time task is sent back for rework','Flags recurring revision problems']),
      row(['Start Date','Fill when you pick up the task','Shows actual vs planned start']),
      row(['Due Date','Set by Manika or client deadline','Priority signal']),
      row(['Completed On','Fill when you mark Done','Turnaround auto-calculates']),
      row(['Turnaround (days)','Auto-calculated — do not fill','Days from Start to Completed On']),
      row(['Notes','Blockers, dependencies, links, context','Reduces follow-up messages']),
    ]),
    div(),
    h2('Status definitions'),
    bul('Not Started — assigned but not yet begun'),
    bul('In Progress — actively being worked on'),
    bul('Review — done by owner, waiting for TL or client feedback'),
    bul('Done — 100% complete, all feedback addressed'),
    bul('Blocked — cannot proceed. Note exactly what is needed and from whom.'),
    div(),
    h2('Individual dashboards'),
    bul('Each team member can create their own filtered view of Daily Tasks:'),
    bul('Open Daily Tasks → click + (Add a view) → Filter: Assigned To = your name'),
    bul('This gives a personal task list that updates in real time — no separate database needed'),
    div(),
    h2('Task Types'),
    bul('Strategy — monthly strategy doc'),
    bul('Brief / Script — reel scripts, post briefs, shoot briefs'),
    bul('Content Calendar — building or updating the monthly calendar'),
    bul('Design — any creative asset'),
    bul('Caption Writing — writing and finalising captions'),
    bul('Posting — scheduling and going live'),
    bul('Ads Management — setup, monitoring, optimisation'),
    bul('Client Communication — calls, approvals, feedback loops'),
    bul('Reporting — monthly reports, performance summaries'),
    bul('Revision — reworks after client or TL feedback'),
  ]);
  log(`  done → ${u(wfParent.id)}`);

  // ── STEP 5: INVOICE AND PAYMENT TRACKER ──────────────────────────────────
  log('5/7  Invoice and Payment Tracker...');
  const invParent = await mkPage(GS, '💰 Invoice and Payment Tracker', '💰');
  // DB first, then 2 sample entries, then guide sub-page
  const invDb = await createInvoiceDB(invParent.id);
  await addInvoiceSamples(invDb.id);
  await add(invParent.id, [co('One row per invoice. Sample entries included — replace with real data. Guide is in the sub-page below.', 'ℹ️')]);
  const invGuide = await mkPage(invParent.id, '📖 Guide and June Billing Overview', '📖');
  await add(invGuide.id, [
    co('How to use the Invoice tracker and June 2025 billing reference.', '📖'),
    div(),
    h2('How to use'),
    bul('Raise a new entry at the start of each month per client'),
    bul('Update Payment Status as soon as payment is received'),
    bul('Filter by Client or Month to check outstanding amounts'),
    bul('Overdue = past Due Date and still unpaid — flag immediately to Manika'),
    div(),
    h2('June 2025 — Billing Reference'),
    tbl(4, true, [
      row(['Client','Services','Amount (Rs)','Note']),
      row(['Aarni by Sharavani','SMM + Ads','65,000','—']),
      row(['Atul Jewellers','SMM + Ads + Branding','50,000','—']),
      row(['Bhagat Jewellers','SMM only','—','Confirm retainer amount']),
      row(['Beri Jewellers','SMM + Ads','30,000','—']),
      row(['Gujranwala Jewellers','SMM + Ads','35,000','—']),
      row(['Luminique','SMM + Ads + Branding','55,000','—']),
      row(['Vidhi Sheth','SMM only','—','Confirm retainer amount']),
      row(['Karan Kothari Jewellers','SMM + Ads','25,000','—']),
      row(['Avani','Branding Project','—','Project fee TBD']),
      row(['Elmara','Website Project','—','Project fee TBD']),
    ]),
    div(),
  ]);
  log(`  done → ${u(invParent.id)}`);

  // ── STEP 6: MEETING NOTES ────────────────────────────────────────────────
  log('6/7  Meeting Notes...');
  const meetParent = await mkPage(GS, '📝 Meeting Notes', '📝');
  // DB first, then sample entry, then guide sub-page
  const meetDb = await createMeetingDB(meetParent.id);
  await addMeetingSample(meetDb.id);
  await add(meetParent.id, [co('One row per meeting. Sample entry included. Guide is in the sub-page below.', 'ℹ️')]);
  const meetGuide = await mkPage(meetParent.id, '📖 Guide', '📖');
  await add(meetGuide.id, [
    co('How to use the Meeting Notes database.', '📖'),
    div(),
    h2('How to use'),
    bul('Add a row right after every call or meeting — do not wait until end of day'),
    bul('Fill Action Items before you close the entry'),
    bul('Set Follow-up Date whenever something is pending'),
    bul('Status: Action Pending until all items are resolved, then Done'),
    div(),
    h2('Meeting types'),
    bul('Client Call — check-ins, feedback, approvals'),
    bul('Internal Sync — team standup, weekly review'),
    bul('Strategy Session — monthly client strategy planning'),
    bul('Shoot Brief — pre-shoot briefing with vendor or client'),
    bul('Review Meeting — campaign or monthly performance review'),
    bul('Onboarding — new client kickoff'),
    div(),
  ]);
  log(`  done → ${u(meetParent.id)}`);

  // ── STEP 7: TEAM KPIs ────────────────────────────────────────────────────
  log('7/7  Team KPIs...');
  const kpiParent = await mkPage(GS, '📊 Team KPIs', '📊');
  // DB first, then guide sub-page with metrics reference and starter targets
  await createKPIsDB(kpiParent.id);
  await add(kpiParent.id, [co('Add one row per metric per team member per month. Metrics guide and June starter targets are in the sub-page below.', 'ℹ️')]);
  const kpiGuide = await mkPage(kpiParent.id, '📖 Metrics Guide and June Targets', '📖');
  await add(kpiGuide.id, [
    co('How to use Team KPIs and June 2025 starter targets.', '📖'),
    div(),
    h2('How to use'),
    bul('Manika sets Target for each metric at the start of the month'),
    bul('Team members update Actual at month end from Meta Insights and Ads Manager'),
    bul('Filter by Team Member, Client, or Month for performance reviews'),
    bul('Status: On Track / Behind / Exceeded — update after Actual is filled'),
    div(),
    h2('Metrics and sources'),
    tbl(2, true, [
      row(['Metric','Source']),
      row(['Posts Published','Count of live posts on Instagram']),
      row(['Reels Published','Count of live reels']),
      row(['Carousels Published','Count of live carousels']),
      row(['Stories Published','Count of stories posted']),
      row(['Reach','Meta Insights — unique accounts reached']),
      row(['Impressions','Meta Insights — total impressions']),
      row(['Engagement Rate (%)','(Likes + Comments + Saves) / Reach x 100']),
      row(['Followers Gained','Net new followers — Meta Insights']),
      row(['Ad ROAS','Meta Ads Manager — Return on Ad Spend']),
      row(['Link Clicks','Bio link + story swipe-up clicks']),
      row(['DMs Received','Inbound DMs from content or ads']),
    ]),
    div(),
    h2('June 2025 Targets — Starter'),
    tbl(5, true, [
      row(['Team Member','Client','Metric','Target','Notes']),
      row(['Tia','Aarni by Sharavani','Posts Published','6','4 posts + 2 reels min']),
      row(['Tia','Aarni by Sharavani','Reach','90,000','—']),
      row(['Tia','Bhagat Jewellers','Posts Published','6','—']),
      row(['Tia','Gujranwala Jewellers','Posts Published','6','—']),
      row(['Tia','Vidhi Sheth','Posts Published','6','—']),
      row(['Vanshika','Atul Jewellers','Posts Published','6','—']),
      row(['Vanshika','Beri Jewellers','Posts Published','6','—']),
      row(['Vanshika','Luminique','Posts Published','6','Luxury positioning push']),
      row(['Vanshika','Luminique','Reach','100,000','—']),
      row(['Vanshika','Karan Kothari Jewellers','Posts Published','9','Per calendar']),
      row(['Pratyusha','Aarni by Sharavani','Ad ROAS','2.5','Min benchmark']),
      row(['Pratyusha','Luminique','Ad ROAS','3.0','Luxury ROAS target']),
    ]),
    div(),
  ]);
  log(`  done → ${u(kpiParent.id)}`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   ALL DONE — 7 pages built');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`\n  1. Founder Dashboard          ${u(dash.id)}`);
  console.log(`  2. Client Operations Hub      ${u(hub.id)}`);
  console.log(`  3. Photoshoots                ${u(shootsParent.id)}`);
  console.log(`  4. Workflow Tracker           ${u(wfParent.id)}`);
  console.log(`  5. Invoice and Payment        ${u(invParent.id)}`);
  console.log(`  6. Meeting Notes              ${u(meetParent.id)}`);
  console.log(`  7. Team KPIs                  ${u(kpiParent.id)}`);
  console.log('\n  Move all 7 to Grydcos HQ:');
  console.log('  Right-click each in Notion sidebar → Move to → Grydcos HQ');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
