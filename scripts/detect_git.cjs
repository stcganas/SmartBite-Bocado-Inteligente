const fs = require('fs');
const { execSync } = require('child_process');

const candidates = [
  'git',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  'C:\\Users\\PC\\AppData\\Local\\Programs\\Git\\cmd\\git.exe',
  'C:\\ProgramData\\chocolatey\\bin\\git.exe',
  'C:\\Users\\PC\\AppData\\Local\\GitHubDesktop\\bin\\github.exe'
];

// Check GitHub Desktop internal git
try {
  const ghBase = 'C:\\Users\\PC\\AppData\\Local\\GitHubDesktop';
  if (fs.existsSync(ghBase)) {
    const entries = fs.readdirSync(ghBase);
    entries.forEach(e => {
      if (e.startsWith('app-')) {
        candidates.push(`${ghBase}\\${e}\\resources\\app\\git\\cmd\\git.exe`);
      }
    });
  }
} catch (e) {}

let found = [];
for (const c of candidates) {
  try {
    const out = execSync(`"${c}" --version`, { stdio: 'pipe' }).toString().trim();
    found.push({ path: c, version: out });
  } catch (err) {}
}

console.log(JSON.stringify(found, null, 2));
