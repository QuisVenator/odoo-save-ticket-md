import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import { ticketIdFromUrl } from './context.js';
export { ticketIdFromUrl } from './context.js';
export const FORM_SELECTOR = '.o_form_view.o_form_project_tasks, .o_form_view.o_fsm_project_task_form_view';

export function findTaskForm(document) {
  return [...document.querySelectorAll(FORM_SELECTOR)].find(form =>
    !form.closest('.o_dialog, [role="dialog"]') &&
    !form.closest('[hidden], .d-none')
  ) ?? null;
}

export function extractTicket(form, url) {
  const ticketId = ticketIdFromUrl(url);
  if (!ticketId) throw new Error('Open a saved task with a numeric ticket ID.');
  const titleField = form.querySelector('[name="name"]');
  const input = titleField?.querySelector('textarea, input');
  const title = (input ? input.value : titleField?.textContent)?.trim();
  if (!title) throw new Error('The ticket title is unavailable or empty.');
  const field = form.querySelector('[name="description"].o_field_html');
  if (!field) throw new Error('Open the Description tab, then try again.');
  const editor = field.querySelector('.odoo-editor-editable, .note-editable, [contenteditable="true"]');
  if (!editor && field.querySelector('.o-wysiwyg')) {
    throw new Error('Wait for the description editor to finish loading, then try again.');
  }
  return { ticketId, title, description: (editor ?? field).cloneNode(true) };
}

export function toMarkdown({ title, description }, pageUrl) {
  const content = description.cloneNode(true);
  content.querySelectorAll('script, style, .o-wysiwyg-local-overlay, .oe-local-overlay, .o_we_power_buttons, [contenteditable="false"][data-oe-local-overlay-id]')
    .forEach(node => node.remove());
  for (const [selector, attribute] of [['a[href]', 'href'], ['img[src]', 'src']]) {
    content.querySelectorAll(selector).forEach(node => {
      try {
        const url = new URL(node.getAttribute(attribute), pageUrl);
        if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) node.setAttribute(attribute, url.href);
        else node.removeAttribute(attribute);
      } catch { node.removeAttribute(attribute); }
    });
  }
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' });
  converter.use(gfm);
  const heading = converter.escape(title.replace(/\s*\r?\n\s*/g, ' '));
  const body = converter.turndown(content).trim();
  return `# ${heading}${body ? `\n\n${body}` : ''}\n`;
}
