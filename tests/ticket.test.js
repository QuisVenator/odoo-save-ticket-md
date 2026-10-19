import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { extractTicket, findTaskForm, toMarkdown } from '../src/ticket.js';

const url = 'https://odoo.samuu.com.py/odoo/action-257/185/tasks/7264/185/project.task/70584';
const fixture = readFileSync(new URL('./fixtures/task.html', import.meta.url), 'utf8');
const setup = () => new JSDOM(fixture, { url });
test('exports current field values, German text, nested lists, and absolute links without UI or chatter', () => {
  const dom = setup();
  const { document } = dom.window;
  document.querySelector('textarea').value = 'Neuer *Titel* [prüfen]';
  const task = extractTicket(findTaskForm(document), url);
  const markdown = toMarkdown(task, url);
  assert.equal(task.ticketId, '70584');
  assert.match(markdown, /^# Neuer \\\*Titel\\\* \\\[prüfen\\\]/);
  assert.match(markdown, /## Ergebnis/);
  assert.match(markdown, /\*\*laden\*\* und \*prüfen\*/);
  assert.match(markdown, /-\s+Versuch\n\s+-\s+Pause\n\s+-\s+Wiederholen/);
  assert.match(markdown, /\[Dokument\]\(https:\/\/odoo.samuu.com.py\/web\/content\/123\)/);
  assert.match(markdown, /!\[Diagramm\]\(https:\/\/odoo.samuu.com.py\/web\/image\/456\)/);
  assert.doesNotMatch(markdown, /Insert image|Private chatter/);
  assert.ok(markdown.endsWith('\n'));
  assert.ok(document.querySelector('.o-wysiwyg-local-overlay'), 'original DOM remains untouched');
  dom.window.close();
});
test('supports read-only fields and an empty description', () => {
  const dom = setup();
  const { document } = dom.window;
  document.querySelector('[name="name"]').textContent = 'Read only';
  document.querySelector('[name="description"]').innerHTML = '<p><br></p>';
  assert.equal(toMarkdown(extractTicket(findTaskForm(document), url), url), '# Read only\n');
  dom.window.close();
});
test('missing fields fail with useful instructions', () => {
  const dom = setup();
  const form = findTaskForm(dom.window.document);
  form.querySelector('[name="description"]').remove();
  assert.throws(() => extractTicket(form, url), /Description tab/);
  form.querySelector('textarea').value = '  ';
  assert.throws(() => extractTicket(form, url), /title/);
  dom.window.close();
});
test('converts tables, task lists, code and blockquotes, strips unsafe links', () => {
  const dom = setup();
  const form = findTaskForm(dom.window.document);
  const editor = form.querySelector('[contenteditable]');
  editor.innerHTML = '<blockquote><p>A quote</p></blockquote><pre><code>const x = 1;\n</code></pre>' +
    '<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr></tbody></table>' +
    '<ul><li><input type="checkbox" checked>Done</li></ul><a href="javascript:alert(1)">Unsafe</a>';
  const markdown = toMarkdown(extractTicket(form, url), url);
  assert.match(markdown, /> A quote/);
  assert.match(markdown, /```\nconst x = 1;\n```/);
  assert.match(markdown, /\| Name \| Value \|/);
  assert.match(markdown, /\[x\] Done/);
  assert.doesNotMatch(markdown, /javascript:/);
  dom.window.close();
});
