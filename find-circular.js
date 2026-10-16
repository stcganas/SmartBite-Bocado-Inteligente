import fs from 'fs';
import path from 'path';

function getImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolvePath(basePath, importPath) {
  if (!importPath.startsWith('.')) return null;
  const dir = path.dirname(basePath);
  let resolved = path.resolve(dir, importPath);
  
  if (fs.existsSync(resolved + '.tsx')) return resolved + '.tsx';
  if (fs.existsSync(resolved + '.ts')) return resolved + '.ts';
  if (fs.existsSync(resolved + '/index.tsx')) return resolved + '/index.tsx';
  if (fs.existsSync(resolved + '/index.ts')) return resolved + '/index.ts';
  
  return null;
}

function findCircularDependencies(dir) {
  const graph = {};
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        const imports = getImports(fullPath);
        graph[fullPath] = imports
          .map(imp => resolvePath(fullPath, imp))
          .filter(Boolean);
      }
    }
  }
  
  walk(dir);
  
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];
  
  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart).concat(neighbor));
      }
    }
    
    recursionStack.delete(node);
  }
  
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }
  
  return cycles;
}

const cycles = findCircularDependencies(path.resolve('./src'));
if (cycles.length > 0) {
  console.log('Circular Dependencies Found:');
  cycles.forEach(cycle => {
    console.log(cycle.map(c => path.relative('./src', c)).join(' -> '));
  });
} else {
  console.log('No circular dependencies found.');
}
