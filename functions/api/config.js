import { jsonResponse } from "../_lib/auth.js";

// GET /api/config — يرجع معلومات عامة آمنة للواجهة (اسم المتجر + مفتاح Moyasar العلني)
export async function onRequestGet(context) {
  const { env } = context;
  return jsonResponse({
    storeName: env.STORE_NAME || "بسطة الوالدة",
    moyasarPublishableKey: env.MOYASAR_PUBLISHABLE_KEY || "",
  });
}
