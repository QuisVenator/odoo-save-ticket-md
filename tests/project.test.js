import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
test('extension permissions are scoped and package/manifest versions agree', () => {
  const manifest = read('../src/manifest.json');
  const pkg = read('../package.json');
  assert.equal(pkg.version, manifest.version);
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['downloads']);
  assert.deepEqual(manifest.host_permissions, ['https://odoo.samuu.com.py/*']);
  assert.deepEqual(manifest.content_scripts[0].matches, manifest.host_permissions);
  assert.deepEqual(manifest.background.scripts, ['background.js']);
});
