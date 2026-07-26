import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('⏳ Generating Codebase Architecture Graph for Antigravity AI...\n');

const apps = ['staff-checkin', 'student-reg', 'staff-reg'];
const graphReport = {};

apps.forEach(appName => {
  const entryPoint = path.join(rootDir, `apps/${appName}/src/App.jsx`);
  if (fs.existsSync(entryPoint)) {
    try {
      const output = execSync(`npx madge --json apps/${appName}/src/App.jsx`, { cwd: rootDir, encoding: 'utf8' });
      graphReport[appName] = JSON.parse(output);
      console.log(`✅ Generated dependency graph for apps/${appName}`);
    } catch (e) {
      console.warn(`⚠️ Warning generating graph for ${appName}:`, e.message);
    }
  }
});

const outputPath = path.join(__dirname, 'codebase_architecture_graph.json');
fs.writeFileSync(outputPath, JSON.stringify(graphReport, null, 2), 'utf8');

console.log(`\n🎉 Architecture Graph saved to: ${outputPath}`);
console.log('Antigravity can now read this graph instantly to save tokens and understand dependencies!');
