import { readFile, writeFile } from 'node:fs/promises';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  throw new Error('Usage: npm run version:set -- MAJOR.MINOR.PATCH');
}
for (const file of ['package.json', 'src/manifest.json']) {
  const data = JSON.parse(await readFile(file, 'utf8'));
  data.version = version;
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}
try {
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  lock.version = version;
  lock.packages[''].version = version;
  await writeFile('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
