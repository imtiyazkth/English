// GET /api/health — reports whether the tutor is configured. Never reveals the secret.
interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const { env } = context;
  const body = {
    ok: true,
    tutorConfigured: typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY.length > 10,
    model: env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    time: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
