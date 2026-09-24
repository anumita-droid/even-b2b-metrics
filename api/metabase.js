function toCsv(text) {
  return text;
}

async function getPublishedCSV(baseUrl, gid) {
  const url = baseUrl +
    (gid ? '?gid=' + encodeURIComponent(gid) + '&single=true&output=csv' : '?output=csv');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      'Accept': 'text/csv,text/plain,*/*',
    },
    redirect: 'follow'
  });

  const text = await response.text();

  if (!response.ok) throw new Error('Google HTTP ' + response.status + ' from ' + url);

  if (/sign in|google sheets access|can.t access your google account/i.test(text.slice(0, 5000))) {
    throw new Error('Google returned an authentication page');
  }

  return text;
}

const PUBLISHED_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQf3juS1A7q2aaxozajUWIrZgpsWUpHMl0XTS0H0nGa3RgF4oRIfDv2vBx8bqL9ltEFSFq1Q_ZJvAdT/pub';
const MASTER_PUBLISHED_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQf7CTzvE1fO40WhI0EO3xMoAIFKIX8U0JawJ4r10eECtN1detQBlguITNLwYDfXhNbpvHKNAzwd7Bf/pub';

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
  internalisation: 336064406
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tab = req.query && req.query.tab;
    const master = req.query && req.query.master;

    if (master === '1') {
      const body = await getPublishedCSV(MASTER_PUBLISHED_URL);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(body);
    }

    if (tab && Object.prototype.hasOwnProperty.call(GIDS, tab)) {
      const body = await getPublishedCSV(PUBLISHED_URL, GIDS[tab]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(body);
    }

    return res.status(400).json({ error: 'Provide ?tab=name or ?master=1' });
  } catch (e) {
    return res.status(502).json({
      error: e && e.message ? e.message : String(e)
    });
  }
}
