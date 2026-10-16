const fs = require('fs');
let file = fs.readFileSync('src/pages/PlatformAdmin.tsx', 'utf8');

const replacement = `
        {
          id: "stats",
          label: "Dashboard y Métricas",
          icon: TrendingUp,
          inactiveColor: "text-blue-500",
          activeClass:
            "bg-blue-600 text-on-surface shadow-lg shadow-blue-200/60",
        },
        {
          id: "traffic",
          label: "Tráfico y Audiencia",
          icon: Activity,
          inactiveColor: "text-rose-500",
          activeClass:
            "bg-rose-600 text-on-surface shadow-lg shadow-rose-200/60",
        },`;

file = file.replace(/\{\s*id:\s*"stats",\s*label:\s*"Dashboard y Métricas",\s*icon:\s*TrendingUp,[\s\S]*?shadow-blue-200\/60",\s*\},/, replacement.trim());

fs.writeFileSync('src/pages/PlatformAdmin.tsx', file);
