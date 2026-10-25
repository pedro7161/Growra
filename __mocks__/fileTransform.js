// Images load as their path relative to the project, so tests can check which picture was picked.
const path = require('path');

module.exports = {
  process(_src, filename) {
    return { code: `module.exports = ${JSON.stringify(path.relative(process.cwd(), filename))};` };
  },
};
