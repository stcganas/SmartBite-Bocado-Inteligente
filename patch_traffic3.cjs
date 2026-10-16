const fs = require('fs');
let file = fs.readFileSync('src/components/AdminTrafficDashboard.tsx', 'utf8');

// The duplicate useState declarations start after the useEffect I added.
file = file.replace(/const \[trafficData, setTrafficData\] = useState<any\[\]>\(\[\]\);\s*const \[onlineUsers, setOnlineUsers\] = useState\(0\);\s*const \[timeRange, setTimeRange\] = useState<'daily'\|'weekly'\|'biweekly'\|'monthly'>\('monthly'\);\s*useEffect\(\(\) => \{[\s\S]*?return \(\) => clearInterval\(interval\);\s*\}, \[timeRange\]\);/, 'const [timeRange, setTimeRange] = useState<"daily"|"weekly"|"biweekly"|"monthly">("monthly");');

// Let's remove the duplicated import useState
file = file.replace(/import \{ useState, useEffect \} from 'react';\nimport \{ db \} from '\.\.\/store\/db';\nimport \{ useAuth \} from '\.\.\/contexts\/AuthContext';/, "import { db } from '../store/db';\nimport { useAuth } from '../contexts/AuthContext';");

// Let's remove the old display variables
file = file.replace(/const totalVisits = trafficData\.reduce\(\(acc, curr\) => acc \+ curr\.visits, 0\);\s*const totalUnique = trafficData\.reduce\(\(acc, curr\) => acc \+ curr\.unique, 0\);\s*const displayVisits = isRestaurantAdmin \? Math\.floor\(totalVisits \/ 15\) : totalVisits;\s*const displayUnique = isRestaurantAdmin \? Math\.floor\(totalUnique \/ 15\) : totalUnique;\s*const displayOnline = isRestaurantAdmin \? Math\.floor\(onlineUsers \/ 20\) : onlineUsers;/, `
  const totalVisits = trafficData.reduce((acc, curr) => acc + curr.visits, 0);
  const totalUnique = trafficData.reduce((acc, curr) => acc + curr.unique, 0);
  const displayVisits = totalVisits;
  const displayUnique = totalUnique;
  const displayOnline = onlineUsers;

  if (loading) {
    return <div className="p-8 text-center"><p className="text-neutral-500 font-bold">Cargando métricas...</p></div>;
  }
`);

fs.writeFileSync('src/components/AdminTrafficDashboard.tsx', file);
