// POST /api/tutor — secure server-side call to the Gemini API.
// The API key lives only in the encrypted Cloudflare secret GEMINI_API_KEY and never reaches the browser.
import { MAX_BODY_BYTES, buildGeminiBody, createThrottle, extractReply, mapUpstreamStatus, parseRequest } from './tutorLogic';

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const UPSTREAM_TIMEOUT_MS = 20_000;
const allow = createThrottle(12, 60_000); // 12 requests per minute per client (best effort)

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const fail = (code: string, status: number): Response => json({ ok: false, code }, status);

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  const key = env.GEMINI_API_KEY;
  if (!key || key.length < 10) return fail('not-configured', 503);

  const len = Number(request.headers.get('content-length') ?? '0');
  if (len > MAX_BODY_BYTES) return fail('too-long', 413);

  const client = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!allow(client)) return fail('rate-limited', 429);

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return fail('too-long', 413);
    raw = JSON.parse(text);
  } catch {
    return fail('bad-response', 400);
  }

  const parsed = parseRequest(raw);
  if (!parsed.ok) return fail(parsed.code === 'too-long' ? 'too-long' : 'bad-response', parsed.status);

  const model = (env.GEMINI_MODEL || DEFAULT_MODEL).replace(/[^a-zA-Z0-9._-]/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildGeminiBody(parsed.value)),
      signal: ctrl.signal,
    });
    if (!res.ok) return fail(mapUpstreamStatus(res.status), res.status === 429 ? 429 : 502);
    const data: unknown = await res.json();
    const out = extractReply(data);
    if (!out.ok) return fail(out.code, out.code === 'blocked' ? 200 : 502);
    return json({ ok: true, reply: out.reply });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return fail('timeout', 504);
    return fail('unavailable', 502);
  } finally {
    clearTimeout(timer);
  }
};

// Anything other than POST is rejected.
export const onRequest = async (): Promise<Response> => fail('bad-response', 405);
