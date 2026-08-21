import { jsonResponse, isAuthenticated } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const ok = await isAuthenticated(context.request, context.env.ADMIN_SESSION_SECRET);
  return jsonResponse({ authenticated: ok });
}
