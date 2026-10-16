const fs = require('fs');
let file = fs.readFileSync('src/components/AdminTrafficDashboard.tsx', 'utf8');

// The file has import React... then MOCK DATA GENERATORS then export const AdminTrafficDashboard
// We will match everything between MOCK DATA GENERATORS and export const and remove it
file = file.replace(/\/\/ --- MOCK DATA GENERATORS ---[\s\S]*?import \{ useState, useEffect/m, 'import { useState, useEffect');

// Inside AdminTrafficDashboard we also have:
/*
  const trafficData = generateTrafficData();
  const onlineUsers = 432;
  const totalVisits = trafficData.reduce((acc, curr) => acc + curr.visits, 0);
  const totalUnique = trafficData.reduce((acc, curr) => acc + curr.unique, 0);
  const displayVisits = isRestaurantAdmin ? Math.floor(totalVisits / 15) : totalVisits;
  const displayUnique = isRestaurantAdmin ? Math.floor(totalUnique / 15) : totalUnique;
  const displayOnline = isRestaurantAdmin ? Math.floor(onlineUsers / 20) : onlineUsers;
*/
file = file.replace(/const trafficData = generateTrafficData\(\);[\s\S]*?const displayOnline = [^\n]*;/m, `
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
