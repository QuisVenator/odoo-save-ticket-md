import { SITE_ORIGIN, ticketIdFromUrl } from './context.js';

export function registerDownloads(browser, urls = URL) {
  const pending = new Map();
  // An event page can restart while Firefox is still downloading. Use the URL
  // in the DownloadItem to release Blob URLs created by this extension as well.
  const ownBlobPrefix = `blob:${browser.runtime.getURL('')}`;
  const release = (id, url) => {
    const objectUrl = pending.get(id) ?? url;
    if (objectUrl) urls.revokeObjectURL(objectUrl);
    pending.delete(id);
  };
  browser.downloads.onChanged.addListener(async delta => {
    if (!['complete', 'interrupted'].includes(delta.state?.current)) return;
    if (pending.has(delta.id)) { release(delta.id); return; }
    const [item] = await browser.downloads.search({ id: delta.id }).catch(() => []);
    if (item?.url?.startsWith(ownBlobPrefix)) release(delta.id, item.url);
  });
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message?.type !== 'DOWNLOAD_MARKDOWN') return undefined;
    if (!sender.tab || sender.frameId !== 0 ||
        !sender.url?.startsWith(`${SITE_ORIGIN}/`) ||
        !/^\d+$/.test(message.ticketId) ||
        ticketIdFromUrl(sender.url) !== message.ticketId ||
        typeof message.markdown !== 'string') {
      return { ok: false, error: 'Invalid ticket download request.' };
    }
    const url = urls.createObjectURL(new Blob([message.markdown], { type: 'text/markdown;charset=utf-8' }));
    try {
      const id = await browser.downloads.download({ url, filename: `${message.ticketId}.md`, saveAs: true });
      pending.set(id, url);
      // Catch downloads that completed before the download() promise resolved.
      const [item] = await browser.downloads.search({ id }).catch(() => []);
      if (['complete', 'interrupted'].includes(item?.state)) release(id);
      return { ok: true };
    } catch (error) {
      urls.revokeObjectURL(url);
      if (/cancel/i.test(error.message)) return { ok: false, cancelled: true };
      return { ok: false, error: 'Firefox could not start the download. Please try again.' };
    }
  });
}
