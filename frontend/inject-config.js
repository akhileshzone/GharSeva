/**
 * Netlify build step: write window.__API_BASE__ from env API_BASE_URL
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiBase = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const out = path.join(__dirname, 'js', 'runtime-config.js');
const content = `/* generated at build time — do not edit */
window.__API_BASE__ = ${JSON.stringify(apiBase)};
`;

fs.writeFileSync(out, content, 'utf8');
console.log('inject-config: API_BASE_URL =', apiBase || '(empty — using config.js fallback)');
