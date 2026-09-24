const METABASE_URL = 'https://metabase.0e1.io';
const METABASE_API_KEY = process.env.METABASE_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { card_id } = req.query;
  if (!card_id) return res.status(400).json({ error: 'card_id required' });
  if (!METABASE_API_KEY) return res.status(500).json({ error: 'METABASE_API_KEY not set' });

  try {
    const response = await fetch(`${METABASE_URL}/api/card/${card_id}/query/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': METABASE_API_KEY,
      },
      body: JSON.stringify({ parameters: [] }),
      // 25 second timeout
      signal: AbortSignal.timeout(25000),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Metabase returned ${response.status}`,
        detail: text.slice(0, 500),
      });
    }

    const data = JSON.parse(text);

    // Cache at Vercel CDN for 2 hours, serve stale for 24 hours while revalidating
    res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');

    return res.status(200).json(data);

  } catch (e) {
    if (e.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Metabase timed out after 25s' });
    }
    return res.status(500).json({ error: e.message });
  }
}
