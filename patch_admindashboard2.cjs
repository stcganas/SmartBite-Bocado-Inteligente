const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const replacement = `
              {activeTab === "traffic" && (
                <div className="mb-6">
                  <AdminTrafficDashboard isRestaurantAdmin={true} />
                </div>
              )}
              {activeTab === "overview" && (`;

file = file.replace(/\{\s*activeTab === "overview"\s*&&\s*\(/, replacement.trim());

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
