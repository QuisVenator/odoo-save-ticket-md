import { findTaskForm, extractTicket, ticketIdFromUrl, toMarkdown } from './ticket.js';

export function mountExporter(document, browser, location) {
  let widget;
  let busy = false;
  let timer;
  function refresh() {
    const form = ticketIdFromUrl(location.href) && findTaskForm(document);
    const toolbar = form?.querySelector('.o_control_panel_main_buttons');
    if (!toolbar) {
      widget?.remove();
      widget = undefined;
      return;
    }
    if (widget?.parentNode === toolbar) return;
    widget?.remove();
    // Odoo may clone toolbar markup while replacing its form controller.
    toolbar.querySelectorAll('.odoo-md-export').forEach(node => node.remove());
    widget = document.createElement('span');
    widget.className = 'odoo-md-export';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary';
    button.textContent = 'Download Markdown';
    button.disabled = busy;
    const status = document.createElement('span');
    status.className = 'odoo-md-export-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      status.textContent = '';
      try {
        const currentForm = findTaskForm(document);
        if (!currentForm) throw new Error('Open a task form, then try again.');
        const ticket = extractTicket(currentForm, location.href);
        const result = await browser.runtime.sendMessage({
          type: 'DOWNLOAD_MARKDOWN', ticketId: ticket.ticketId,
          markdown: toMarkdown(ticket, location.href),
        });
        if (!result?.ok && !result?.cancelled) throw new Error(result?.error || 'Unable to start the download.');
      } catch (error) {
        status.textContent = error.message || 'Unable to export the ticket.';
      } finally {
        busy = false;
        button.disabled = false;
        widget?.querySelector('button')?.removeAttribute('disabled');
      }
    });
    widget.append(button, status);
    toolbar.append(widget);
  }
  const observer = new document.defaultView.MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 80);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  const schedule = () => { clearTimeout(timer); timer = setTimeout(refresh, 80); };
  document.defaultView.addEventListener('popstate', schedule);
  document.defaultView.addEventListener('hashchange', schedule);
  refresh();
  return () => {
    observer.disconnect(); clearTimeout(timer); widget?.remove();
    document.defaultView.removeEventListener('popstate', schedule);
    document.defaultView.removeEventListener('hashchange', schedule);
  };
}

if (typeof browser !== 'undefined' && typeof document !== 'undefined') {
  mountExporter(document, browser, window.location);
}
