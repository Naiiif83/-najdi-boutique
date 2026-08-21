import { jsonResponse, checkPassword, createSessionCookie } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));

  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return jsonResponse(
      { error: "لوحة التحكم غير مهيأة بعد. أضيفي ADMIN_PASSWORD و ADMIN_SESSION_SECRET من إعدادات Cloudflare Pages" },
      { status: 500 }
    );
  }

  if (!checkPassword(body.password, env.ADMIN_PASSWORD)) {
    return jsonResponse({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const cookie = await createSessionCookie(env.ADMIN_SESSION_SECRET);
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
