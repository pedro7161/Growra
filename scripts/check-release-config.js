#!/usr/bin/env node
// Warns (or with --strict fails) while Growra still ships Google's TEST AdMob ids.
// The real ids live in app.json (androidAppId) and src/constants/adConfig.ts (PRODUCTION_REWARDED_AD_UNIT_ID).
const fs = require('fs');
const path = require('path');
const TEST_PUBLISHER = 'ca-app-pub-3940256099942544';
const root = process.cwd(); // npm run executes from the project root
const problems = [];
if (/"androidAppId":\s*"ca-app-pub-3940256099942544/.test(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))) {
  problems.push('app.json: AdMob androidAppId is still the test id');
}
if (fs.readFileSync(path.join(root, 'src/constants/adConfig.ts'), 'utf8').includes(`PRODUCTION_REWARDED_AD_UNIT_ID = "${TEST_PUBLISHER}`)) {
  problems.push('adConfig.ts: PRODUCTION_REWARDED_AD_UNIT_ID is still the test unit');
}
if (problems.length === 0) {
  console.log('Release config OK: real AdMob ids.');
  process.exit(0);
}
problems.forEach((problem) => console.warn(`WARNING: ${problem}`));
if (process.argv.includes('--strict')) process.exit(1);
console.warn('(Fine for internal testing; `npm run check:release` fails on these.)');
