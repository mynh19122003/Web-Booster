import fs from 'node:fs/promises';
const folder = new URL('../outputs/category-pricing-20261014/', import.meta.url);
const templates = JSON.parse(await fs.readFile(new URL('templates.json', folder)));
const jobs = [];
const add = (product, key, changes, options = {}) => {
  const details = structuredClone(templates[product].details);
  Object.assign(details, changes);
  Object.assign(details.orderDetails, options);
  jobs.push({ product, key, details });
};
add('mastery', '0-1', { currentTier: 0, desiredTier: 1 });
for (let level = 1; level < 10; level++) add('mastery', `${level}-${level + 1}`, { currentTier: level, desiredTier: level + 1 });
add('mastery', 'Ahri', { currentTier: 1, desiredTier: 7 }, { champion: 'Ahri' });
for (let level = 0; level < 5; level++) add('honor', `${level}-${level + 1}`, { currentLevel: level, desiredLevel: level + 1 });
for (const tier of ['Iron','Bronze','Silver','Gold','Platinum','Emerald','Diamond']) {
  for (const queue of ['Solo/Duo', 'Flex']) {
    add('divisions', `${tier}-${queue}`, { currentTier: tier, currentDivision: 'IV', desiredTier: tier, desiredDivision: 'III' }, { queue, duoQ: false });
    add('wins', `${tier}-${queue}`, { currentTier: tier, currentDivision: 'IV', gameCount: 1 }, { queue, duoQ: false });
    add('placements', `${tier}-${queue}`, { currentTier: tier, currentDivision: 'IV', gameCount: 1 }, { queue, duoQ: false });
  }
}
for (const queue of ['Summoners Rift','ARAM','Quickplay']) add('normals', queue, {gameCount: 5}, {queue});
for (let count = 1; count <= 10; count++) add('challenges', `${count}`, {gameCount: count});
for (const tier of ['Iron','Bronze','Silver','Gold','Platinum','Emerald','Diamond']) {
  for (const gain of ['0-14 LP','14-17 LP','17-19 LP','19-22 LP','22-25 LP','25-28 LP','28-30 LP','30-33 LP']) {
    add('wins', `${tier}-${gain}`, {currentTier:tier,currentDivision:'IV',gameCount:1}, {lpGain:gain});
  }
  for (const division of ['III','II','I']) {
    const next = division === 'I' ? {desiredTier: ['Iron','Bronze','Silver','Gold','Platinum','Emerald','Diamond','Master'][['Iron','Bronze','Silver','Gold','Platinum','Emerald','Diamond'].indexOf(tier)+1],desiredDivision: division === 'I' && tier === 'Diamond' ? null : 'IV'} : {desiredTier:tier,desiredDivision:division === 'III' ? 'II' : 'I'};
    add('divisions', `${tier}-${division}-Flex`, {currentTier:tier,currentDivision:division,...next}, {queue:'Flex',duoQ:false});
  }
}
const results = JSON.parse(await fs.readFile(new URL('samples.json',folder)).catch(() => '[]'));
for (const job of jobs) {
  if (results.some(row => row.product === job.product && row.key === job.key)) continue;
  let response, result;
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch('https://api.boost-royal.com/checkout/calculatePrice', {method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'boostroyal.com'},body:JSON.stringify({details:job.details}),signal:AbortSignal.timeout(20000)});
    const body = await response.text();
    if (response.ok && body.startsWith('{')) { result = JSON.parse(body); break; }
    await new Promise(resolve => setTimeout(resolve, 10000 * (attempt + 1)));
  }
  if (!result) throw new Error(`Public calculator unavailable for ${job.key}`);
  results.push({...job, status: response.status, result});
  console.log(job.product, job.key, result.price);
  await fs.writeFile(new URL('samples.json',folder),JSON.stringify(results,null,2));
  await new Promise(resolve => setTimeout(resolve, 700));
}
