const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const replacement = `
        {
          id: "overview",
          label: "Resumen",
          icon: TrendingUp,
          inactiveColor: "text-blue-500",
          activeClass:
            "text-blue-600 bg-blue-50 shadow-[0_8px_16px_rgba(37,99,235,0.2)] drop-shadow-md border border-blue-100",
        },
        {
          id: "traffic",
          label: "Tráfico y Audiencia",
          icon: Activity,
          inactiveColor: "text-rose-500",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(225,29,72,0.2)] drop-shadow-md border border-rose-100",
        },`;

file = file.replace(/\{\s*id:\s*"overview",\s*label:\s*"Resumen",\s*icon:\s*TrendingUp,[\s\S]*?border-blue-100",\s*\}/, replacement.trim());

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
