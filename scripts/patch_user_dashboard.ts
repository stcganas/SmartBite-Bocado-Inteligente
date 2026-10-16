import fs from 'fs';

let content = fs.readFileSync('src/components/ReferralDashboard.tsx', 'utf8');

content = content.replace(
  'const [enrolledRestaurants, setEnrolledRestaurants] = useState<any[]>([]);',
  'const [enrolledRestaurants, setEnrolledRestaurants] = useState<any[]>([]);\n  const [pendingRequests, setPendingRequests] = useState<any[]>([]);'
);

const fetchRequestsCode = `
      if (appUser?.anniversaries) {
        const enrolledIds = appUser.anniversaries
          .filter(a => a.type === "referral_enrollment")
          .map(a => a.date);
        setEnrolledRestaurants(restaurants.filter(r => enrolledIds.includes(r.id)));
      }
      
      try {
         const reqs = await db.getReferralRequests();
         setPendingRequests(reqs.filter((r: any) => r.userId === appUser?.id && r.status === 'pending'));
      } catch (e) {
         console.warn(e);
      }
`;

content = content.replace(/if \(appUser\?.anniversaries\) \{[\s\S]*?setEnrolledRestaurants.*?;[\s\S]*?\}/m, fetchRequestsCode);

// Add the rendering of pending requests inside activeSubTab === 'restaurants'
const renderRestaurants = `
          {activeSubTab === "restaurants" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative z-20">
              
              {pendingRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-on-surface font-black mb-3">Solicitudes Pendientes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex justify-between items-center">
                        <div>
                           <p className="font-bold text-amber-900">{req.restaurantName}</p>
                           <p className="text-xs text-amber-700/80 font-medium">Esperando aprobación</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                           <TrendingUp className="w-4 h-4 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-on-surface font-black mt-2">Restaurantes Inscritos</h3>
              {enrolledRestaurants.length === 0 ? (
`;

content = content.replace(/\{activeSubTab === "restaurants" && \([\s\S]*?\{enrolledRestaurants.length === 0 \? \(/m, renderRestaurants);

fs.writeFileSync('src/components/ReferralDashboard.tsx', content, 'utf8');
console.log('Patched ReferralDashboard');
