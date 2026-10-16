const fs = require('fs');
let file = fs.readFileSync('src/pages/PlatformAdmin.tsx', 'utf8');

const replacement = `
            {activeTab === "traffic" && <AdminTrafficDashboard />}
            {activeTab === "stats" && (`;

file = file.replace(/\{\s*activeTab === "stats"\s*&&\s*\(/, replacement.trim());

fs.writeFileSync('src/pages/PlatformAdmin.tsx', file);
