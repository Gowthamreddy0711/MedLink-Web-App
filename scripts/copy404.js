import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist');
const src404 = path.join(dist, 'index.html');
const dst404 = path.join(dist, '404.html');

if (!fs.existsSync(src404)) {
  console.error('Error: dist/index.html not found. Run npm run build first.');
  process.exit(1);
}

fs.copyFileSync(src404, dst404);
console.log('✅ Created dist/404.html for GitHub Pages routing');
