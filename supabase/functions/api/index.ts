// Supabase Edge Function: secure Gemini proxy. Key lives only in the Supabase secret GEMINI_API_KEY.
import { MAX_BODY_BYTES, buildGeminiBody, createThrottle, extractReply, mapUpstreamStatus, parseRequest } from './tutorLogic.ts';

const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://imtiyazkth.github.io,http://localhost:5173').split(',').map((s) => s.trim());
const allow = createThrottle(12, 60_000);

function reply(req: Request, status: number, body: unknown): Response {
  const origin = req.headers.get('origin') ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
  if (ALLOWED.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
const fail = (req: Request, code: string, status: number) => reply(req, status, { ok: false, code });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: reply(req, 204, null).headers });
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  const model = (Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite').replace(/[^a-zA-Z0-9._-]/g, '');

  if (path.endsWith('/health') && req.method === 'GET') {
    return reply(req, 200, { ok: true, tutorConfigured: key.length > 10, model, time: new Date().toISOString() });
  }
  if (!path.endsWith('/tutor')) return fail(req, 'bad-response', 404);
  if (req.method !== 'POST') return fail(req, 'bad-response', 405);
  if (key.length < 10) return fail(req, 'not-configured', 503);
  if (Number(req.headers.get('content-length') ?? '0') > MAX_BODY_BYTES) return fail(req, 'too-long', 413);
  const client = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  if (!allow(client)) return fail(req, 'rate-limited', 429);

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return fail(req, 'too-long', 413);
    raw = JSON.parse(text);
  } catch {
    return fail(req, 'bad-response', 400);
  }
  const parsed = parseRequest(raw);
  if (!parsed.ok) return fail(req, parsed.code === 'too-long' ? 'too-long' : 'bad-response', parsed.status);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildGeminiBody(parsed.value)),
      signal: ctrl.signal,
    });
    if (!r.ok) return fail(req, mapUpstreamStatus(r.status), r.status === 429 ? 429 : 502);
    const out = extractReply(await r.json());
    if (!out.ok) return fail(req, out.code, out.code === 'blocked' ? 200 : 502);
    return reply(req, 200, { ok: true, reply: out.reply });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return fail(req, 'timeout', 504);
    return fail(req, 'unavailable', 502);
  } finally {
    clearTimeout(timer);
  }
});
