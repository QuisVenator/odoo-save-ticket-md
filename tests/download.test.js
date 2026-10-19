import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDownloads } from '../src/download.js';

const url = 'https://odoo.samuu.com.py/odoo/action-257/185/tasks/7264/185/project.task/70584';
const sender = { tab: { id: 1 }, frameId: 0, url };
const message = { type: 'DOWNLOAD_MARKDOWN', ticketId: '70584', markdown: '# Prüfung\n' };
function setup({ downloadError, state = 'in_progress', searchError } = {}) {
  let listener, changed, blob;
  const calls = [], revoked = [];
  const browser = {
    runtime: { getURL: () => 'moz-extension://test/', onMessage: { addListener(fn) { listener = fn; } } },
    downloads: {
      onChanged: { addListener(fn) { changed = fn; } },
      async download(options) { calls.push(options); if (downloadError) throw downloadError; return 7; },
      async search() { if (searchError) throw searchError; return [{ state, url: 'blob:moz-extension://test/export' }]; },
    },
  };
  registerDownloads(browser, {
    createObjectURL(value) { blob = value; return 'blob:moz-extension://test/export'; },
    revokeObjectURL(value) { revoked.push(value); },
  });
  return { send: (...args) => listener(...args), change: (...args) => changed(...args), calls, revoked, getBlob: () => blob };
}
test('opens Save As with the numeric filename and UTF-8 Markdown', async () => {
  const mock = setup();
  assert.deepEqual(await mock.send(message, sender), { ok: true });
  assert.deepEqual(mock.calls, [{ url: 'blob:moz-extension://test/export', filename: '70584.md', saveAs: true }]);
  assert.equal(await mock.getBlob().text(), message.markdown);
  assert.equal(mock.getBlob().type, 'text/markdown;charset=utf-8');
  assert.deepEqual(mock.revoked, []);
  await mock.change({ id: 7, state: { current: 'complete' } });
  assert.deepEqual(mock.revoked, ['blob:moz-extension://test/export']);
});
test('releases interrupted and immediately completed downloads', async () => {
  const mock = setup();
  await mock.send(message, sender);
  await mock.change({ id: 7, state: { current: 'interrupted' } });
  assert.equal(mock.revoked.length, 1);
  const completed = setup({ state: 'complete' });
  await completed.send(message, sender);
  assert.equal(completed.revoked.length, 1);
});
test('cancellation is quiet, failure is actionable, both release the Blob', async () => {
  for (const [error, expected] of [
    ['Download canceled by the user', { ok: false, cancelled: true }],
    ['Disk error', { ok: false, error: 'Firefox could not start the download. Please try again.' }],
  ]) {
    const mock = setup({ downloadError: new Error(error) });
    assert.deepEqual(await mock.send(message, sender), expected);
    assert.equal(mock.revoked.length, 1);
  }
});
test('rejects other sites, subframes, stale IDs, and invalid messages', async () => {
  const mock = setup();
  for (const [request, source] of [
    [message, { ...sender, url: 'https://example.com/70584' }],
    [message, { ...sender, frameId: 1 }], [message, { url }],
    [{ ...message, ticketId: '../70584' }, sender],
    [{ ...message, ticketId: '123' }, sender],
    [{ ...message, markdown: null }, sender],
  ]) assert.equal((await mock.send(request, source)).ok, false);
  assert.equal(await mock.send({ type: 'OTHER' }, sender), undefined);
  assert.equal(mock.calls.length, 0);
});
test('a metadata lookup failure does not invalidate an accepted download', async () => {
  const mock = setup({ searchError: new Error('Lookup failed') });
  assert.deepEqual(await mock.send(message, sender), { ok: true });
  await mock.change({ id: 7, state: { current: 'complete' } });
  assert.equal(mock.revoked.length, 1);
});
