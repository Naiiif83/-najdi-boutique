import { jsonResponse, requireAuth } from "../_lib/auth.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// POST /api/upload  (form-data: file)  — لوحة التحكم فقط
// يرفع الصورة إلى نفس مستودع GitHub (بدون حاجة لخدمة تخزين مدفوعة) ويرجع رابطها العام
export async function onRequestPost(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env, request } = context;

  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    return jsonResponse(
      { error: "رفع الصور غير مهيأ بعد. أضيفي GITHUB_TOKEN و GITHUB_OWNER و GITHUB_REPO من إعدادات Cloudflare Pages" },
      { status: 500 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file === "string") {
    return jsonResponse({ error: "لم يتم إرفاق أي صورة" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonResponse({ error: "الصيغة غير مدعومة، استخدمي JPG أو PNG أو WEBP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return jsonResponse({ error: "حجم الصورة كبير جداً (الحد 8 ميجا)" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `${crypto.randomUUID()}.${ext}`;
  const path = `public/uploads/${key}`;
  const branch = env.GITHUB_BRANCH || "main";

  const base64Content = arrayBufferToBase64(await file.arrayBuffer());

  const ghRes = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "najdi-boutique-admin",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `رفع صورة منتج: ${key}`,
        content: base64Content,
        branch,
      }),
    }
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text().catch(() => "");
    return jsonResponse({ error: `تعذر رفع الصورة (${ghRes.status}): ${errText.slice(0, 200)}` }, { status: 502 });
  }

  const url = `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${branch}/${path}`;
  return jsonResponse({ url }, { status: 201 });
}
