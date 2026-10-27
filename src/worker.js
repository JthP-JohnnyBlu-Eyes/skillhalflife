// Serves the static site from ./public, sends http and www to https://skillhalflife.com,
// and adds security headers to every response.
// The questionnaire, checkout and plan delivery will live here later.

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:" || url.hostname === "www.skillhalflife.com") {
      url.protocol = "https:";
      url.hostname = "skillhalflife.com";
      return Response.redirect(url.toString(), 301);
    }
    const asset = await env.ASSETS.fetch(request);
    const res = new Response(asset.body, asset);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  },
};
