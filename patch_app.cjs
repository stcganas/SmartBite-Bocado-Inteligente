const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(/import \{ NotificationProvider \} from "\.\/contexts\/NotificationContext";/, 'import { NotificationProvider } from "./contexts/NotificationContext";\nimport { VisitTracker } from "./components/VisitTracker";');

file = file.replace(/<OneSignalNotificationsManager \/>/, '<OneSignalNotificationsManager />\n              <VisitTracker />');

fs.writeFileSync('src/App.tsx', file);
