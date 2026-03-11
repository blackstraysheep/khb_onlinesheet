const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
  "http://localhost:3000",
  "http://localhost:8080",
  "https://blackstraysheep.github.io",
];

function getAllowedOrigins(): Set<string> {
  const extraOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins]);
}

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  return getAllowedOrigins().has(origin);
}

export function buildCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin");
  const allowed = origin && getAllowedOrigins().has(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
