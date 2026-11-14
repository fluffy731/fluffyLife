// Wikimedia Commons photos: build the API request, keep only freely licensed files, and turn Commons' metadata into a credit line.
// No DOM and no three.js, so the tests can run it in Node.
const API = 'https://commons.wikimedia.org/w/api.php';

export function apiUrl(files, width = 640) {
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(width), titles: files.join('|') });
  return `${API}?${q}`;
}

// CC0, public domain, CC BY and CC BY-SA (any version) may be shown with a credit. Anything else (NC, ND, fair use, unknown) is left out.
export function freeLicence(short) {
  const s = String(short || '').trim();
  if (!s) return false;
  if (/\b(NC|ND)\b|non-?commercial|no ?deriv|fair use/i.test(s)) return false;
  return /^(CC0|CC-?Zero|Public domain|PD\b|PD-)/i.test(s) || /^CC[ -]BY(-SA)?([ -]\d(\.\d)?)?/i.test(s);
}

// Commons gives the author as HTML; keep the text only.
export const plain = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

// Response (formatversion 2) to { 'File:Title.jpg': { thumb, page, author, licence, licenceUrl } } for the free files only.
// Commons normalises titles (underscores to spaces, first letter capitalised), so results are keyed by the title we asked for.
export function parse(json, asked = []) {
  const q = json?.query || {}, out = {};
  const back = new Map(asked.map((t) => [t, t]));
  for (const n of q.normalized || []) back.set(n.to, n.from);
  for (const p of q.pages || []) {
    const ii = p.imageinfo?.[0]; if (!ii || p.missing) continue;
    const m = ii.extmetadata || {}, licence = m.LicenseShortName?.value || '';
    if (!freeLicence(licence)) continue;
    out[back.get(p.title) || p.title] = {
      thumb: ii.thumburl || ii.url, page: ii.descriptionurl, author: plain(m.Artist?.value) || 'Unknown author',
      licence, licenceUrl: m.LicenseUrl?.value || '',
    };
  }
  return out;
}
