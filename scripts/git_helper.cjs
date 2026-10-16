const { spawnSync } = require('child_process');
const path = require('path');

const GIT_EXE = 'C:\\Users\\PC\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\git\\cmd\\git.exe';
const args = process.argv.slice(2);

const result = spawnSync(GIT_EXE, args.length ? args : ['status'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit'
});

process.exit(result.status || 0);
