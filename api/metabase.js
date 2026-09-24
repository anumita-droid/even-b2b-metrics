const PUBLISHED_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQf3juS1A7q2aaxozajUWIrZgpsWUpHMl0XTS0H0nGa3RgF4oRIfDv2vBx8bqL9ltEFSFq1Q_ZJvAdT/pub';
const MASTER_PUBLISHED_URL = String.fromCharCode(104,116,116,112,115,58,47,47,100,111,99,115,46,103,111,111,103,108,101,46,99,111,109,47,115,112,114,101,97,100,115,104,101,101,116,115,47,100,47,101,47,50,80,65,67,88,45,49,118,81,102,55,67,84,122,118,69,49,102,79,52,48,87,104,73,48,69,79,51,120,77,111,65,73,70,75,73,88,56,85,48,74,97,119,74,52,114,49,48,101,69,67,116,78,49,100,101,116,81,66,108,103,117,73,84,78,76,119,89,68,102,88,104,78,98,112,118,72,75,78,65,122,119,100,55,66,102,47,112,117,98);

const GIDS = {
  ri_cl_combined: 1860220766,
  cashless: 870573513,
  ri_incl_tally: 239240117,
  ri_excl_tally: 668091118,
  approved_monthly: 572385142,
  os_monthly: 1848642806,
  network_comm_monthly: 1028462889,
  approved_quarterly: 1319465919,
  os_quarterly: 612155943,
  network_comm_quarterly: 122253378,
  hospital_opd: 106636389,
  internalisation: 336064406,
};

function decodeHtml(str) {
  return str
    .replace(/<br\\s*\\/?>/gi, '\\n')
    .replace(/<\\/p>/gi, '\\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\\r?\\n\\s*\\n+/g, '\\n')
    .trim();
}

function csvEscape(value) {
  const s = String(value ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

function parsePublishedHTML(html) {
  const tableMatch = html.match(/<table[^>]*class=["'][^"']*waffle[^"']*["'][^>]*>[\\s\\S]*?<\\/table>/i)
    || html.match(/<table[\\s\\S]*?<\\/table>/i);

  if (!tableMatch) {
    throw new Error('Published Google Sheet did not contain a data table');
  }

  const table = tableMatch[0];
  const rows = [];
  const rowRe = /<tr[^>]*>([\\s\\S]*?)<\\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRe.exec(table))) {
    const cells = [];
    const cellRe = /<(?:td|th)\\b[^>]*>([\\s\\S]*?)<\\/(?:td|th)>/gi;
    let cellMatch;

    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      cells.push(decodeHtml(cellMatch[1]));
    }

    if (cells.length) rows.push(cells);
  }

  if (!rows.length) {
    throw new Error('Published Google Sheet table contained no rows');
  }

  const width = Math.max(...rows.map(r => r.length));
  return rows
    .map(r => Array.from({ length: width }, (_, i) => csvEscape(r[i] ?? '')).join(','))
    .join('\\n');
}

async function getPublishedCSV(baseUrl, gid) {
  const publishedHtmlUrl = baseUrl.replace('/pub', '/pubhtml');
  const url = gid
    ? publishedHtmlUrl + '?gid=' + gid + '&single=true&widget=false&headers=false'
    : publishedHtmlUrl + '?single=true&widget=false&headers=false';

  const r = await fetch(url, { cache: 'no-store' });
  const body = await r.text();

  if (!r.ok) {
    throw new Error('Google returned HTTP ' + r.status);
  }

  if (/sign in|google sheets access|can.t access your google account/i.test(body.slice(0, 5000))) {
    throw new Error('Google returned an authentication page');
  }

  return parsePublishedHTML(body);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { tab, master } = req.query;

  if (master === '1') {
    try {
      const body = await getPublishedCSV(MASTER_PUBLISHED_URL);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(body);
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  if (tab && Object.prototype.hasOwnProperty.call(GIDS, tab)) {
    try {
      const body = await getPublishedCSV(PUBLISHED_URL, GIDS[tab]);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(body);
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Provide ?tab=name or ?master=1' });
}
