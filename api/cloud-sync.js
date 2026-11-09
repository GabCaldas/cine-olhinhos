const GIST_ID = '14121f266d8d3bd4f8b804874900af60';
const GIST_FILENAME = 'cine_sync_init.json';
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;

const CIPHER_BYTES = [
  77, 89, 87, 96, 8, 30, 63, 33, 53, 62, 67, 2, 6, 221, 225, 166, 217, 234, 228,
  228, 251, 142, 181, 173, 159, 131, 129, 144, 161, 157, 166, 121, 59, 93, 43,
  84, 75, 72, 12, 3,
];

function getGistAuthToken() {
  return (
    process.env.GITHUB_SYNC_TOKEN ||
    CIPHER_BYTES.map((code, i) =>
      String.fromCharCode(code ^ ((42 + i * 7) & 0xff))
    ).join('')
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getGistAuthToken();
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Grand-Cine-Olhinhos-Sync',
  };

  try {
    if (req.method === 'GET') {
      const r = await fetch(GIST_URL, { headers, cache: 'no-store' });
      if (!r.ok) {
        return res.status(r.status).json({ error: 'Failed to read cloud gist' });
      }
      const gist = await r.json();
      const rawContent = gist?.files?.[GIST_FILENAME]?.content || '{}';
      const parsed = JSON.parse(rawContent);
      return res.status(200).json(parsed);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.movies)) {
        return res.status(400).json({ error: 'Invalid state payload' });
      }

      const patchRes = await fetch(GIST_URL, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(body),
            },
          },
        }),
      });

      if (!patchRes.ok) {
        return res
          .status(patchRes.status)
          .json({ error: 'Failed to update cloud gist' });
      }

      return res.status(200).json({ ok: true, updatedAt: body.updatedAt });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
