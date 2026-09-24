const METABASE_URL = 'https://metabase.0e1.io';
const METABASE_API_KEY = process.env.METABASE_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { card_id } = req.query;
  if (!card_id) return res.status(400).json({ error: 'card_id required' });

  try {
    const response = await fetch(`${METABASE_URL}/api/card/${card_id}/query/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': METABASE_API_KEY,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
