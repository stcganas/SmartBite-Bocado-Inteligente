const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
file = file.replace(/label: "Visitas y Métricas"/g, 'label: "Visitas y Métricas", id: "traffic"');
fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
