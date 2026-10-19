import test from 'node:test';
import assert from 'node:assert/strict';
import { ticketIdFromUrl } from '../src/context.js';

export const TASK_URL = 'https://odoo.samuu.com.py/odoo/action-257/185/tasks/7264/185/project.task/70584';
test('reference URL selects the final record ID, ignoring queries and trailing slashes', () => {
  for (const suffix of ['', '/', '?view=form', '/?view=form#description']) {
    assert.equal(ticketIdFromUrl(TASK_URL + suffix), '70584');
  }
});
test('rejects unrelated origins, routes, records, and invalid URLs', () => {
  for (const url of [
    'invalid', TASK_URL.replace('https:', 'http:'),
    TASK_URL.replace('odoo.samuu.com.py', 'example.com'),
    TASK_URL.replace('odoo.samuu.com.py', 'odoo.samuu.com.py.example.com'),
    TASK_URL.replace('project.task', 'res.partner'),
    TASK_URL.replace('70584', 'new'), 'https://odoo.samuu.com.py/odoo/action-257',
  ]) assert.equal(ticketIdFromUrl(url), null, url);
});
