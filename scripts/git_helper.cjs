const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const GIT_EXE = 'C:\\Users\\PC\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\git\\cmd\\git.exe';

const args = process.argv.slice(2).join(' ') || 'status';

try {
  const cmd = `"${GIT_EXE}" ${args}`;
  const output = execSync(cmd, { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' });
  if (output.trim()) console.log(output.trim());
} catch (err) {
  if (err.stdout && err.stdout.trim()) console.log(err.stdout.trim());
  if (err.stderr && err.stderr.trim()) console.error(err.stderr.trim());
  process.exit(err.status || 1);
}
