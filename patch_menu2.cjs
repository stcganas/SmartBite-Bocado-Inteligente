const fs = require('fs');
let file = fs.readFileSync('src/pages/PlatformAdmin.tsx', 'utf8');
file = file.replace(/label: "Visitas y Métricas"/g, 'label: "Visitas y Métricas", id: "traffic"');
fs.writeFileSync('src/pages/PlatformAdmin.tsx', file);
