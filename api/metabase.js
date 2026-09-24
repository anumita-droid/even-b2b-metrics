const METABASE_URL = 'https://metabase.0e1.io';
const METABASE_API_KEY = process.env.METABASE_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { card_id } = req.query;
  if (!card_id) return res.status(400).json({ error: 'card_id required' });
  if (!METABASE_API_KEY) return res.status(500).json({ error: 'METABASE_API_KEY env var not set' });

  try {
    // Try the JSON export endpoint first (simpler)
    const response = await fetch(`${METABASE_URL}/api/card/${card_id}/query/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': METABASE_API_KEY,
      },
      body: JSON.stringify({ parameters: [] }),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Metabase returned ${response.status}`,
        detail: text.slice(0, 500),
        key_set: !!METABASE_API_KEY,
        key_prefix: METABASE_API_KEY?.slice(0, 10)
      });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message, key_set: !!METABASE_API_KEY });
  }
}
