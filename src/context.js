export const SITE_ORIGIN = 'https://odoo.samuu.com.py';

export function ticketIdFromUrl(value) {
  try {
    const url = new URL(value);
    if (url.origin !== SITE_ORIGIN) return null;
    // A task record, rather than an arbitrary Odoo route ending in a number.
    const match = url.pathname.replace(/\/+$/, '').match(/^\/odoo\/.+\/project\.task\/(\d+)$/);
    return match?.[1] ?? null;
  } catch { return null; }
}

