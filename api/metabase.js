import crypto from 'crypto';

const SHEET_ID = '1eoBpZtFVFaNrvNsoWwqBify5km1N8wnWzzua-PkxIks';
const MASTER_ID = '1Ovf4qHm398T3tiGpSFmE1jf354nTPB5rtkgYeFt1w00';

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

function base64url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in Vercel environment variables'
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const assertion = `${unsignedToken}.${base64url(signer.sign(privateKey))}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      `Google OAuth failed: ${tokenData.error_description || tokenData.error || 'unknown error'}`
    );
  }

  return tokenData.access_token;
}

async function getSheetTitle(accessToken, spreadsheetId, gid) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `?fields=sheets.properties`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google Sheets API failed: ${data.error?.message || response.statusText}`
    );
  }

  const sheet = data.sheets?.find(
    (s) => Number(s.properties?.sheetId) === Number(gid)
  );

  if (!sheet) {
    throw new Error(`No sheet found for gid ${gid}`);
  }

  return sheet.properties.title;
}

async function getSheetCsv(accessToken, spreadsheetId, gid) {
  const title = await getSheetTitle(accessToken, spreadsheetId, gid);
  const range = `'${title.replace(/'/g, "''")}'`;

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}` +
    `?majorDimension=ROWS`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google Sheets API failed: ${data.error?.message || response.statusText}`
    );
  }

  return rowsToCsv(data.values || []);
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows) {
  return rows
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { tab, master } = req.query;

  try {
    const accessToken = await getGoogleAccessToken();

    if (master === '1') {
      const csv = await getSheetCsv(accessToken, MASTER_ID, 0);

      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.status(200).send(csv);
    }

    if (tab && Object.prototype.hasOwnProperty.call(GIDS, tab)) {
      const csv = await getSheetCsv(accessToken, SHEET_ID, GIDS[tab]);

      res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.status(200).send(csv);
    }

    return res.status(400).json({
      error: 'Provide ?tab=name or ?master=1',
      availableTabs: Object.keys(GIDS),
    });
  } catch (error) {
    console.error('Google Sheets fetch error:', error);

    return res.status(500).json({
      error: 'Unable to fetch Google Sheet data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
