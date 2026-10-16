const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const aiRoutesStart = code.indexOf('\n  // AI Route for health check');
const aiRoutesEnd = code.indexOf('\n  const wss = new WebSocketServer({ noServer: true });');

if (aiRoutesStart !== -1 && aiRoutesEnd !== -1) {
    const aiRoutesCode = code.substring(aiRoutesStart, aiRoutesEnd);
    code = code.substring(0, aiRoutesStart) + code.substring(aiRoutesEnd);
    
    // insert them before Vite middleware
    const viteStart = code.indexOf('  // Use Vite middleware in development mode');
    code = code.substring(0, viteStart) + aiRoutesCode + '\n' + code.substring(viteStart);
    
    fs.writeFileSync('server.ts', code);
    console.log("SUCCESS");
} else {
    console.log("NOT FOUND", aiRoutesStart, aiRoutesEnd);
}
