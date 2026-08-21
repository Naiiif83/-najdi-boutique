// أدوات تسجيل دخول لوحة التحكم (جلسة موقّعة عبر HMAC، بدون مكتبات خارجية)

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // أسبوع

export async function createSessionCookie(secret) {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `admin.${exp}`;
  const sig = await hmac(payload, secret);
  const token = `${payload}.${sig}`;
  return `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie() {
  return "admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export async function isAuthenticated(request, secret) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  if (!match) return false;
  const token = decodeURIComponent(match[1]);
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  if (role !== "admin") return false;
  if (Date.now() > Number(exp)) return false;
  const expectedSig = await hmac(`${role}.${exp}`, secret);
  return timingSafeEqual(expectedSig, sig);
}

export function checkPassword(input, expected) {
  if (typeof input !== "string" || typeof expected !== "string") return false;
  return timingSafeEqual(input, expected);
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export async function requireAuth(context) {
  const ok = await isAuthenticated(context.request, context.env.ADMIN_SESSION_SECRET);
  if (!ok) {
    return jsonResponse({ error: "غير مصرح لك، الرجاء تسجيل الدخول" }, { status: 401 });
  }
  return null;
}
