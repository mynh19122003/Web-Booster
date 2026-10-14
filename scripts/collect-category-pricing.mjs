import fs from 'node:fs/promises';

// Public calculator reads only: this script never submits an order.
export function decodeCalculator(html) {
  const match = html.match(/<script type="qwik\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Missing public calculator state');
  const { objs } = JSON.parse(match[1]);
  const decode = ref => {
    if (typeof ref !== 'string') return ref;
    const value = objs[parseInt(ref, 36)];
    if (!value || typeof value !== 'object') return value;
    return Array.isArray(value) ? value.map(decode) : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decode(entry)]));
  };
  const index = objs.findIndex(value => value && typeof value === 'object' && 'orderDetails' in value && 'service' in value && 'price' in value);
  if (index < 0) throw new Error('Missing calculator quote');
  return decode(index.toString(36));
}

const folder = new URL('../outputs/category-pricing-20261014/', import.meta.url);
await fs.mkdir(folder, { recursive: true });
const paths = { divisions: 'lol-boosting', wins: 'lol-boosting/ranked-wins', placements: 'lol-boosting/placements', mastery: 'lol-boosting/champion-mastery', honor: 'lol-boosting/honor', challenges: 'lol-boosting/challenges', normals: 'lol-boosting/normals' };
const templates = {};
for (const [product, path] of Object.entries(paths)) {
  const url = `https://boostroyal.com/${path}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const html = await response.text();
  await fs.writeFile(new URL(`${product}.html`, folder), html);
  console.log('Reading', url);
  templates[product] = { url, details: decodeCalculator(html) };
}
await fs.writeFile(new URL('templates.json', folder), JSON.stringify(templates, null, 2));
for (const [product, entry] of Object.entries(templates)) console.log(product, JSON.stringify(entry.details));
