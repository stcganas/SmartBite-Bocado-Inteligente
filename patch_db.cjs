const fs = require('fs');
let file = fs.readFileSync('src/store/db.ts', 'utf8');

const visitInterface = `
export interface AppVisit {
  id: string;
  restaurant_id?: string;
  user_id?: string;
  visit_date: string;
  created_at: string;
  device_info?: string;
  city?: string;
  gender?: string;
  age_range?: string;
}
`;

file = file.replace(/export interface AppUser \{/, visitInterface + '\nexport interface AppUser {');

fs.writeFileSync('src/store/db.ts', file);
