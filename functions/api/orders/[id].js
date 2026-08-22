import { jsonResponse } from "../../_lib/auth.js";

function rowToOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    locationUrl: row.location_url,
    items: JSON.parse(row.items || "[]"),
    totalSar: row.total_sar,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
  };
}

// GET /api/orders/:id — عام (المعرّف عشوائي غير قابل للتخمين)، تستخدمه صفحة تأكيد الطلب
export async function onRequestGet(context) {
  const { env, params } = context;
  const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(params.id).first();
  if (!row) return jsonResponse({ error: "الطلب غير موجود" }, { status: 404 });
  return jsonResponse({ order: rowToOrder(row) });
}
