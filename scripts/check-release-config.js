#!/usr/bin/env node
// Warns (or with --strict fails) while Growra still ships Google's TEST AdMob ids.
// Swap BOTH app.json androidAppId and src/constants/adConfig.ts REWARDED_AD_UNIT_ID once AdMob accepts the app.
const fs = require('fs');
const path = require('path');
const TEST_PUBLISHER = 'ca-app-pub-3940256099942544';
const root = path.join(__dirname, '..');
const problems = [];
if (fs.readFileSync(path.join(root, 'app.json'), 'utf8').includes(TEST_PUBLISHER)) {
  problems.push('app.json: AdMob androidAppId is still the test id');
}
if (fs.readFileSync(path.join(root, 'src/constants/adConfig.ts'), 'utf8').includes(`REWARDED_AD_UNIT_ID = "${TEST_PUBLISHER}`)) {
  problems.push('adConfig.ts: REWARDED_AD_UNIT_ID is still the test unit');
}
if (problems.length === 0) {
  console.log('Release config OK: real AdMob ids.');
  process.exit(0);
}
problems.forEach((problem) => console.warn(`WARNING: ${problem}`));
if (process.argv.includes('--strict')) process.exit(1);
console.warn('(Fine for internal testing; `npm run check:release` fails on these.)');
