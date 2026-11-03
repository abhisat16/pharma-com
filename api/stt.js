// Server-side proxy to Sarvam Speech-to-Text (Vercel Edge Function).
// The key lives only in the SARVAM_API_KEY environment variable, never in the browser.
//   GET  /api/stt  -> { ready: true|false }   (is the key configured?)
//   POST /api/stt  -> multipart form, same fields as Sarvam's /speech-to-text, minus the key
export const config = { runtime: 'edge' };

const SARVAM_URL = 'https://api.sarvam.ai/speech-to-text';
const ALLOWED_FIELDS = ['file', 'model', 'language_code', 'keyterms', 'mode'];
const MAX_BYTES = 2_000_000; // ~30 s of 16 kHz mono WAV is under 1 MB

export default async function handler(request) {
  const key = process.env.SARVAM_API_KEY;
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  if (request.method === 'GET') return json({ ready: Boolean(key) });
  if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed' } }, 405);
  if (!key) return json({ error: { code: 'NOT_CONFIGURED', message: 'SARVAM_API_KEY is not set on the server.' } }, 503);

  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BYTES) return json({ error: { code: 'too_large', message: 'Audio is too large.' } }, 413);

  let incoming;
  try { incoming = await request.formData(); }
  catch { return json({ error: { code: 'bad_form', message: 'Expected multipart form data.' } }, 400); }

  const audio = incoming.get('file');
  if (!audio || typeof audio === 'string') return json({ error: { code: 'no_audio', message: 'file is missing.' } }, 400);

  const out = new FormData();
  for (const name of ALLOWED_FIELDS) {
    const v = incoming.get(name);
    if (v == null) continue;
    if (name === 'file') out.append(name, v, 'command.wav');
    else out.append(name, String(v));
  }

  const upstream = await fetch(SARVAM_URL, { method: 'POST', headers: { 'api-subscription-key': key }, body: out });
  return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json' } });
}
