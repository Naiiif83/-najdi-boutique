import { jsonResponse, checkPassword, createSessionCookie } from "../../_lib/auth.js";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return jsonResponse(
      { error: "لوحة التحكم غير مهيأة بعد. أضيفي ADMIN_PASSWORD و ADMIN_SESSION_SECRET من إعدادات Cloudflare Pages" },
      { status: 500 }
    );
  }

  const { count } = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ? AND created_at > datetime('now', ?)`
  )
    .bind(ip, `-${WINDOW_MINUTES} minutes`)
    .first();

  if (count >= MAX_ATTEMPTS) {
    return jsonResponse(
      { error: `محاولات دخول كثيرة، حاولي مرة أخرى بعد ${WINDOW_MINUTES} دقيقة` },
      { status: 429, headers: { "Retry-After": String(WINDOW_MINUTES * 60) } }
    );
  }

  if (!checkPassword(body.password, env.ADMIN_PASSWORD)) {
    await env.DB.prepare("INSERT INTO login_attempts (ip) VALUES (?)").bind(ip).run();
    return jsonResponse({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();

  const cookie = await createSessionCookie(env.ADMIN_SESSION_SECRET);
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
