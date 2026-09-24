const SHEET_ID = '1eoBpZtFVFaNrvNsoWwqBify5km1N8wnWzzua-PkxIks';
const MASTER_ID = '1Ovf4qHm398T3tiGpSFmE1jf354nTPB5rtkgYeFt1w00';

const GIDS = {
  ri_cl_combined: 1860220766, cashless: 870573513,
  ri_incl_tally: 239240117, ri_excl_tally: 668091118,
  approved_monthly: 572385142, os_monthly: 1848642806,
  network_comm_monthly: 1028462889, approved_quarterly: 1319465919,
  os_quarterly: 612155943, network_comm_quarterly: 122253378,
  hospital_opd: 106636389, internalisation: 336064406,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { tab, master } = req.query;

  // Master List
  if (master === '1') {
    try {
      const r = await fetch(`https://docs.google.com/spreadsheets/d/${MASTER_ID}/export?format=csv&gid=0`);
      const text = await r.text();
      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(text);
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  // Sheet tab
  if (tab && GIDS[tab]) {
    try {
      const r = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GIDS[tab]}`);
      const text = await r.text();
      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(text);
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'Provide ?tab=name or ?master=1' });
}
