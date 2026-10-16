const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace text-white with text-on-surface if it looks like a class
  content = content.replace(/text-white/g, 'text-on-surface');
  // Replace bg-neutral-900 and 800 with bg-surface-variant
  content = content.replace(/bg-neutral-900/g, 'bg-surface-variant');
  content = content.replace(/bg-neutral-800/g, 'bg-surface-base');
  // Replace text-neutral-400 with text-on-surface-muted
  content = content.replace(/text-neutral-400/g, 'text-on-surface-muted');
  content = content.replace(/text-neutral-500/g, 'text-on-surface-variant');
  content = content.replace(/text-neutral-300/g, 'text-on-surface-variant');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files with semantic colors.`);
