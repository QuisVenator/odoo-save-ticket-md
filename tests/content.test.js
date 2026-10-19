import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountExporter } from '../src/content.js';

const url = 'https://odoo.samuu.com.py/odoo/action-257/185/tasks/7264/185/project.task/70584';
const fixture = readFileSync(new URL('./fixtures/task.html', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 140));
function setup(sendMessage = async () => ({ ok: true })) {
  const dom = new JSDOM(fixture, { url });
  const stop = mountExporter(dom.window.document, { runtime: { sendMessage } }, dom.window.location);
  return { dom, document: dom.window.document, stop };
}
test('renders once, exports edits, follows SPA navigation, and removes itself outside task forms', async () => {
  const messages = [];
  const mock = setup(async message => { messages.push(message); return { ok: true }; });
  try {
    const { document, dom } = mock;
    document.querySelector('textarea').value = 'Edited title';
    document.querySelector('main').append(document.createElement('div'));
    await tick();
    assert.equal(document.querySelectorAll('.odoo-md-export').length, 1);
    document.querySelector('.odoo-md-export button').click();
    await tick();
    assert.equal(messages[0].ticketId, '70584');
    assert.match(messages[0].markdown, /^# Edited title\n/);
    dom.window.history.pushState({}, '', url.replace('70584', '70585'));
    document.querySelector('textarea').value = 'Second task';
    document.querySelector('main').append(document.createElement('div'));
    await tick();
    document.querySelector('.odoo-md-export button').click();
    await tick();
    assert.equal(messages[1].ticketId, '70585');
    assert.match(messages[1].markdown, /^# Second task\n/);
    const form = document.querySelector('.o_form_view');
    form.replaceWith(form.cloneNode(true));
    await tick();
    assert.equal(document.querySelectorAll('.odoo-md-export').length, 1);
    dom.window.history.pushState({}, '', '/odoo');
    document.querySelector('main').remove();
    await tick();
    assert.equal(document.querySelector('.odoo-md-export'), null);
  } finally { mock.stop(); mock.dom.window.close(); }
});
test('blocks duplicate clicks until the dialog resolves and treats cancellation quietly', async () => {
  let resolve, calls = 0;
  const mock = setup(() => { calls++; return new Promise(done => { resolve = done; }); });
  try {
    const button = mock.document.querySelector('.odoo-md-export button');
    button.click(); button.click();
    assert.equal(calls, 1);
    assert.ok(button.disabled);
    resolve({ ok: false, cancelled: true });
    await tick();
    assert.equal(button.disabled, false);
    assert.equal(mock.document.querySelector('[role="status"]').textContent, '');
  } finally { mock.stop(); mock.dom.window.close(); }
});
test('shows extraction and download failures inline', async () => {
  const mock = setup(async () => ({ ok: false, error: 'Download failed' }));
  try {
    mock.document.querySelector('.odoo-md-export button').click();
    await tick();
    assert.equal(mock.document.querySelector('[role="status"]').textContent, 'Download failed');
    mock.document.querySelector('[name="description"]').remove();
    mock.document.querySelector('.odoo-md-export button').click();
    await tick();
    assert.match(mock.document.querySelector('[role="status"]').textContent, /Description tab/);
  } finally { mock.stop(); mock.dom.window.close(); }
});
