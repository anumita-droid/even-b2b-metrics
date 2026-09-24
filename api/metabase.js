const APPS_SCRIPT_URL = 'https://script.google.com/a/macros/even.in/s/AKfycbxpfINsXrWgntDEf_09Vvz0_jv4Yj3FuiobVSSZ4-rcC8ofUM5P9n6DhaHrdsnD-_jh/exec';

async function getPublishedCSV(params) {
  const url = APPS_SCRIPT_URL + '?' + params;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error('Apps Script HTTP ' + response.status);
  return await response.text();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tab = req.query?.tab;
    const master = req.query?.master;

    let params;
    if (master === '1') params = 'master=1';
    else if (tab) params = 'tab=' + tab;
    else return res.status(400).json({ error: 'Provide ?tab=name or ?master=1' });

    const body = await getPublishedCSV(params);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(body);

  } catch (e) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
}
