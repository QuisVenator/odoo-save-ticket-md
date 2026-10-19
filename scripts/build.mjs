import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const manifest = JSON.parse(await readFile(new URL('../src/manifest.json', import.meta.url)));
if (pkg.version !== manifest.version) throw new Error('Package and manifest versions must match.');
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/content.js', 'src/background.js'],
  outdir: 'dist', bundle: true, format: 'iife', platform: 'browser', target: 'firefox128',
  legalComments: 'eof',
});
await writeFile('dist/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
await copyFile('src/content.css', 'dist/content.css');
