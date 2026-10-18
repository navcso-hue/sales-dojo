"use strict";
// Static content for the Gauntlet. Companies come from companies.json (real, researched);
// everything here is ours: the offers you sell (fictional vendors), call types, difficulty
// guide, voices and the framework vocabulary the judge uses.

const OFFERS = {
  "ai-receptionist": {
    vendor: "Ringly", product: "AI receptionist",
    what: "Answers every call 24/7, books appointments straight into the calendar and texts the team a summary.",
    price: "from $299 / £249 a month per location",
    proof: ["Clinics on Ringly recover about 1 in 5 calls they used to miss", "Live in one day, works with the existing phone number"],
  },
  "video-ads": {
    vendor: "Framecut", product: "short-form video ad production",
    what: "20 new short-form video ads a month for Meta, TikTok and YouTube Shorts, built from performance data.",
    price: "from $3,500 / £2,900 a month, 30-day paid pilot available",
    proof: ["Average client cut cost per acquisition 22% in 90 days", "First 5 ads delivered in 7 days"],
  },
  "outbound-sdr": {
    vendor: "Pipeline Co.", product: "outsourced SDR team",
    what: "A trained SDR team that books qualified meetings for your sales reps, paid per meeting held.",
    price: "$250–400 per qualified meeting held, no retainer",
    proof: ["Clients average 18 qualified meetings a month by month two", "No long contract: cancel any month"],
  },
  "spend-mgmt": {
    vendor: "Ledgerly", product: "spend management",
    what: "Corporate cards with automatic receipt capture, approval rules and expense reports that close themselves.",
    price: "free cards; software from $8 per user a month",
    proof: ["Finance teams cut month-end close by 4–5 days on average", "Receipts captured from a photo or email in seconds"],
  },
  "crm-automation": {
    vendor: "Relay", product: "CRM with WhatsApp and email automation",
    what: "A simple CRM that follows up every lead automatically over WhatsApp, SMS and email until they book.",
    price: "from $49 per user a month",
    proof: ["Customers reply to 3x more leads within 5 minutes", "Set up in a week, imports existing spreadsheets"],
  },
  "seo-content": {
    vendor: "Rankwell", product: "SEO and content",
    what: "Technical SEO plus 8 expert-written articles a month targeting buyer-intent keywords.",
    price: "from $2,500 / £2,000 a month, 6-month minimum",
    proof: ["Typical client doubles organic leads in 6–9 months", "Monthly report tied to leads, not just rankings"],
  },
  "review-mgmt": {
    vendor: "Starboard", product: "reviews and reputation management",
    what: "Asks every happy customer for a Google review at the right moment and flags unhappy ones before they post.",
    price: "from $199 a month per location",
    proof: ["Locations average +0.4 stars and 3x more reviews in 90 days", "Works with the existing booking or POS system"],
  },
  "hr-hiring": {
    vendor: "Hirewise", product: "AI hiring and screening",
    what: "Screens and schedules high-volume candidates automatically, 24/7, in their own language.",
    price: "from $600 a month per hiring location",
    proof: ["Time-to-hire down from 14 days to 4 on average", "Recruiters save about 10 hours a week each"],
  },
  "cyber-security": {
    vendor: "Shieldline", product: "managed security and phishing training",
    what: "24/7 monitored security, phishing simulations and staff training, with an insurer-ready report.",
    price: "from $9 per employee a month",
    proof: ["Phishing click rates fall from ~30% to under 5% in 6 months", "Helps meet cyber-insurance requirements"],
  },
  "route-opt": {
    vendor: "Routewise", product: "fleet route optimisation",
    what: "Plans the best routes for every driver each morning and gives customers live delivery tracking.",
    price: "from $35 per vehicle a month",
    proof: ["Fleets cut fuel and overtime by 12–18%", "Live in two weeks, works on drivers' existing phones"],
  },
  "ugc-influencer": {
    vendor: "Creatorlink", product: "influencer and UGC campaigns",
    what: "Matches the brand with vetted creators, runs the campaigns and delivers usage-licensed UGC for ads.",
    price: "campaigns from $5,000; UGC packs from $1,500",
    proof: ["Clients get 30+ ad-ready UGC videos per campaign", "Creators vetted for real audiences, not bots"],
  },
  "bi-dashboards": {
    vendor: "Clearsight", product: "BI dashboards",
    what: "Connects sales, marketing, stock and finance data into one live dashboard leadership actually uses.",
    price: "from $1,200 a month including setup",
    proof: ["Replaces 10+ hours a week of spreadsheet reporting", "First dashboard live in 3 weeks"],
  },
  "energy-solar": {
    vendor: "Sunvolt Commercial", product: "commercial rooftop solar",
    what: "Designs, installs and maintains rooftop solar for business sites, with zero-upfront financing.",
    price: "zero upfront on a power-purchase agreement, or outright purchase",
    proof: ["Typical site cuts its electricity bill 25–40%", "Payback usually 3–5 years on outright purchase"],
  },
  "corporate-wellness": {
    vendor: "Thrive@Work", product: "employee wellness and benefits",
    what: "Mental health support, fitness and health benefits in one app, with usage reporting for HR.",
    price: "from $6 per employee a month",
    proof: ["Clients see sick days fall around 15% in the first year", "Average 60% staff activation in month one"],
  },
  "pos-loyalty": {
    vendor: "Loopcard", product: "loyalty and online ordering",
    what: "A branded loyalty and ordering app linked to the POS, so regulars come back more and order direct.",
    price: "from $149 a month per location",
    proof: ["Members visit 20–30% more often", "Direct orders avoid 15–30% delivery-app commission"],
  },
  "ai-automation": {
    vendor: "Northstack AI", product: "custom AI agents and workflow automation",
    what: "Builds AI agents and automations for repetitive work: lead follow-up, support replies, reporting, data entry.",
    price: "projects from $4,000, then from $500 a month",
    proof: ["Clients typically automate 15–25 hours of manual work a week", "First automation live in 2–3 weeks"],
  },
};

// Each call type: what you're trying to achieve and how the buyer arrives.
const CALL_TYPES = {
  cold:       { label: "Cold call", goal: "Book a 15–20 minute meeting", setup: "The buyer does not know you and was not expecting this call.", skills: ["opener", "objections", "next_step"] },
  gatekeeper: { label: "Gatekeeper", goal: "Get a meeting with the decision-maker", setup: "You reach an assistant, receptionist or office manager who screens calls for the decision-maker.", skills: ["opener", "confidence", "phrasing"] },
  discovery:  { label: "Discovery call", goal: "Uncover the real problem, qualify budget, authority and timing, and agree a demo with the team", setup: "The buyer agreed last week to a 20-minute intro call. They are open but guarded.", skills: ["discovery", "listening", "next_step"] },
  objections: { label: "Objection storm", goal: "Keep them talking and still secure a next step", setup: "The buyer is sceptical and fires objection after objection. Most are brush-offs; one is real.", skills: ["objections", "confidence", "listening"] },
  followup:   { label: "Follow-up after demo", goal: "Get a firm commitment to a pilot or a proposal review with a date", setup: "The buyer saw a demo 10 days ago, said it looked interesting, then went quiet.", skills: ["value", "next_step", "objections"] },
  negotiation:{ label: "Pricing & negotiation", goal: "Close the deal without giving more than a 10% discount, and trade anything you give", setup: "The buyer wants to buy but is pushing hard on price and terms.", skills: ["confidence", "value", "objections"] },
  closing:    { label: "Closing call", goal: "Get a verbal yes and a signature date", setup: "The buyer has a proposal and must decide this week. There is internal hesitation.", skills: ["next_step", "confidence", "objections"] },
  renewal:    { label: "Renewal & upsell", goal: "Secure the renewal and upgrade them to the next plan", setup: "The buyer is an existing customer, renewal is in 30 days, and usage is mixed.", skills: ["discovery", "value", "next_step"] },
  angry:      { label: "Angry customer", goal: "De-escalate, keep the account, and agree a concrete fix with a date", setup: "The buyer is an existing customer and is furious about a recent failure that cost them money.", skills: ["listening", "confidence", "phrasing"] },
  inbound:    { label: "Inbound lead callback", goal: "Qualify them and book a demo", setup: "The buyer filled in a form on your website yesterday asking about pricing.", skills: ["discovery", "listening", "next_step"] },
};

const SKILLS = { opener: "Opener", discovery: "Discovery", listening: "Listening", value: "Value", objections: "Objections", next_step: "Next step", confidence: "Confidence", phrasing: "Phrasing" };
// Which call types train which skill, for picking the "weakest skill" call each day.
const SKILL_TO_TYPES = {
  opener: ["cold", "gatekeeper"], discovery: ["discovery", "inbound"], listening: ["angry", "discovery"],
  value: ["followup", "renewal"], objections: ["objections", "cold"], next_step: ["closing", "followup"],
  confidence: ["negotiation", "angry"], phrasing: ["gatekeeper", "angry"],
};

const LEVEL_GUIDE = {
  1: "Friendly and open. One simple condition to say yes. Reveals problems easily. One mild objection at most.",
  2: "Friendly but busy. One condition. One or two easy objections.",
  3: "Polite, time-poor. Two conditions. Two objections, one of them a brush-off.",
  4: "Polite but cautious. Two conditions. Needs a clear reason to keep talking past the first 30 seconds.",
  5: "Sceptical and impatient, has an incumbent or a workaround. Two or three conditions. Two or three objections including a brush-off and a price question.",
  6: "Sceptical and testing. Three conditions. Pushes back on vague claims and asks for proof.",
  7: "Guarded, close to hostile. Three conditions. Tests the rep, stalls once, ends the call quickly after a clear mistake.",
  8: "Hostile or highly protective. Three or four conditions. May tell one small lie or hide who decides. Little patience.",
  9: "Very hard. Hidden decision-maker, multiple real objections, anchors hard on price or timing. Only an excellent rep wins.",
  10: "Nightmare. Pretends interest then stalls, contradicts themselves, demands concessions. Wins require near-perfect discovery, control and closing.",
};

// Gemini prebuilt voices, grouped so a buyer's voice fits the persona.
const VOICES = {
  female: ["Kore", "Leda", "Aoede", "Zephyr", "Callirrhoe", "Despina", "Sulafat", "Gacrux"],
  male: ["Puck", "Charon", "Fenrir", "Orus", "Iapetus", "Algenib", "Schedar", "Sadaltager", "Achird"],
};

const PERSONALITIES = ["driver (direct, results-focused, impatient)", "analytical (wants numbers and proof, slow to trust)", "amiable (friendly, avoids conflict, hard to get a real commitment from)", "expressive (talkative, big-picture, easily distracted)"];
const MOODS = ["rushed", "neutral", "curious", "irritated", "distracted", "tired"];

// Shared vocabulary so the judge names techniques consistently across calls.
const FRAMEWORKS = [
  "Pattern-interrupt opener (Blount)", "Clear reason for the call (Blount)", "Asking directly for the meeting (Blount)", "Ledge / turnaround on a brush-off (Blount)",
  "SPIN situation questions", "SPIN problem questions", "SPIN implication questions", "SPIN need-payoff questions",
  "Gap Selling current state", "Gap Selling future state", "Quantifying the impact (Gap Selling)",
  "Labelling (Voss)", "Mirroring (Voss)", "Calibrated how/what questions (Voss)", "Accusation audit (Voss)", "No-oriented question (Voss)",
  "Commercial teaching insight (Challenger)", "Taking control of the conversation (Challenger)",
  "Value equation framing (Hormozi)", "Risk reversal / guarantee (Hormozi)",
  "Social proof (Cialdini)", "Authority (Cialdini)", "Scarcity (Cialdini)", "Commitment and consistency (Cialdini)",
  "Positioning against the alternative (Dunford)", "Matching the buyer's awareness level (Schwartz)",
  "Specific time close", "Trading concessions, not giving them", "Summarising before asking",
];
