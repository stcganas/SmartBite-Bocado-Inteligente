import fs from 'fs';
import https from 'https';

const downloadIcon = (url, path) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadIcon(res.headers.location, path).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(path);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

async function main() {
  await downloadIcon('https://placehold.co/192x192/f97316/ffffff/png?text=SB', 'public/pwa-192x192.png');
  await downloadIcon('https://placehold.co/512x512/f97316/ffffff/png?text=SB', 'public/pwa-512x512.png');
  await downloadIcon('https://placehold.co/512x512/f97316/ffffff/png?text=SB', 'public/pwa-512x512-maskable.png');
  console.log("Icons downloaded.");
}

main();
