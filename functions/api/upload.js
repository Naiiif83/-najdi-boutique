import { jsonResponse, requireAuth } from "../_lib/auth.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

// POST /api/upload  (form-data: file)  — لوحة التحكم فقط، يرفع صورة إلى R2 ويرجع رابطها
export async function onRequestPost(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env, request } = context;
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

  await env.IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return jsonResponse({ url: `/images/${key}` }, { status: 201 });
}
