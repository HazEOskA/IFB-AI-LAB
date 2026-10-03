const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:4173";
const routes = [
  "/",
  "/o-instytucie/instytut/",
  "/o-instytucie/ludzie/",
  "/o-instytucie/klienci/",
  "/strategie-fundraisingowe/",
  "/wdrozenie-fundraisingu-program-12-miesieczny/",
  "/kampanie-fundraisingowe/",
  "/szkolenia/",
  "/kurs_kampania_swiateczna/",
  "/system-regularnych-darowizn-w-ngo/",
  "/sklep/",
  "/bezplatna-wiedza/",
  "/bezplatna-wiedza/bezplatne-ebooki/",
  "/blog/",
  "/kontakt/",
  "/ai-lab/"
];

const failures = [];
const warnings = [];
const images = new Set();

function count(re, value) {
  return [...value.matchAll(re)].length;
}

async function get(url, opts={}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { redirect: "follow", signal: controller.signal, ...opts });
  } finally {
    clearTimeout(timer);
  }
}

for (const route of routes) {
  const url = new URL(route, ORIGIN);
  let res;
  try {
    res = await get(url);
  } catch (err) {
    failures.push(`${route}: request failed: ${err.message}`);
    continue;
  }
  if (!res.ok) {
    failures.push(`${route}: HTTP ${res.status}`);
    continue;
  }

  const html = await res.text();
  const title = (html.match(/<title>(.*?)<\/title>/is) || [])[1]?.trim();
  const description = (html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)/i) || [])[1]?.trim();
  const canonical = (html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1]?.trim();
  const viewport = /<meta\s+name=["']viewport["']/i.test(html);
  const h1Count = count(/<h1\b/gi, html);

  if (!title) failures.push(`${route}: missing <title>`);
  if (!description) failures.push(`${route}: missing meta description`);
  if (!canonical) failures.push(`${route}: missing canonical`);
  if (!viewport) failures.push(`${route}: missing viewport meta`);
  if (h1Count !== 1) failures.push(`${route}: expected 1 H1, got ${h1Count}`);

  for (const m of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    images.add(new URL(m[1], url).href);
  }
  for (const m of html.matchAll(/<link\b[^>]*\bas=["']image["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    images.add(new URL(m[1], url).href);
  }
}

for (const asset of ["/assets/styles.css", "/assets/site.js", "/robots.txt", "/sitemap.xml"]) {
  try {
    const res = await get(new URL(asset, ORIGIN));
    if (!res.ok) failures.push(`${asset}: HTTP ${res.status}`);
  } catch (err) {
    failures.push(`${asset}: request failed: ${err.message}`);
  }
}

let imageOk = 0;
for (const imageUrl of [...images]) {
  try {
    let res = await get(imageUrl, { method: "HEAD" });
    if (!res.ok || res.status === 405) {
      res = await get(imageUrl, { headers: { Range: "bytes=0-2047" } });
    }
    if (!res.ok && res.status !== 206) {
      failures.push(`image: ${imageUrl} -> HTTP ${res.status}`);
      continue;
    }
    const type = res.headers.get("content-type") || "";
    if (type && !type.startsWith("image/")) {
      warnings.push(`image content-type unexpected: ${imageUrl} -> ${type}`);
    }
    imageOk++;
  } catch (err) {
    failures.push(`image: ${imageUrl} -> ${err.message}`);
  }
}

console.log(`QA ROUTES: ${routes.length}/${routes.length} fetched`);
console.log(`QA IMAGES: ${imageOk}/${images.size} reachable`);
if (warnings.length) {
  console.log("QA WARNINGS:");
  for (const w of warnings) console.log("- " + w);
}
if (failures.length) {
  console.error("QA FAILURES:");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log("QA RESULT: PASS");
