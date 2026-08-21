import { jsonResponse, clearSessionCookie } from "../../_lib/auth.js";

export async function onRequestPost() {
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
