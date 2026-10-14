import fs from 'node:fs/promises';
const read = async path => JSON.parse(await fs.readFile(new URL(path, import.meta.url)));
const samples = await read('../outputs/category-pricing-20261014/samples.json');
const packages = (await read('../data/pricing/project-prices.json')).packages;
const anchor = product => packages.find(row => row.game === 'league-of-legends' && row.product === product);
const hours = result => {
  const [min,max] = result.completionTime.split('-').map(Number);
  const factor = result.completionTimeUnit === 'days' ? 24 : 1;
  return {minHours:min*factor,maxHours:max*factor};
};
const steps = (product, referencePrice) => samples.filter(row => row.product === product && /^\d+-\d+$/.test(row.key) && row.result.price > 0).map(row => {
  const [from,to] = row.key.split('-').map(Number);
  return {from,to,naUsd: row.result.price / referencePrice * anchor(product).naUsd, ...hours(row.result)};
});
const wins = samples.filter(row => row.product === 'wins' && row.key.endsWith(' LP')).map(row => {
  const separator = row.key.indexOf('-');
  const tier = row.key.slice(0,separator), gain = row.key.slice(separator+1);
  const base = samples.find(row => row.product === 'wins' && row.key === `${tier}-Solo/Duo`).result.price;
  return {tier,gain,factor:row.result.price/base};
});
if (wins.length !== 56) throw new Error('Incomplete win gain snapshot');
const output = {
  reviewedAt: '2026-10-14',
  sources: ['https://boostroyal.com/lol-boosting','https://boostroyal.com/lol-boosting/champion-mastery','https://boostroyal.com/lol-boosting/honor','https://boostroyal.com/lol-boosting/challenges','https://boostroyal.com/lol-boosting/ranked-wins','https://boostroyal.com/lol-boosting/normals'],
  policy: 'Source quote ratios anchored to existing NA commercial packages. Flex uses existing Solo rates; seven tier pairs verified equal. Champion selection does not change the mastery price. Honor levels below 3 are not sold by the source calculator.',
  mastery: steps('mastery',46.53), honor: steps('honor',348.3), wins,
  challenges: samples.filter(row => row.product === 'challenges').map(row => ({quantity:Number(row.key),naUsd:row.result.price/6.51*anchor('challenges').naUsd,...hours(row.result)})),
};
await fs.writeFile(new URL('../data/pricing/category-rates.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
