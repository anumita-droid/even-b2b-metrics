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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { tab, master } = req.query;

  // Published Master List
  if (master === '1') {
    try {
      const r = await fetch(
        `${MASTER_PUBLISHED_URL}?output=csv`
      );
      const text = await r.text();

      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(text);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Published Google Sheet tab
  if (tab && Object.prototype.hasOwnProperty.call(GIDS, tab)) {
    try {
      const r = await fetch(
        `${PUBLISHED_URL}?output=csv&gid=${GIDS[tab]}`
      );
      const text = await r.text();

      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(text);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Provide ?tab=name or ?master=1' });
}
