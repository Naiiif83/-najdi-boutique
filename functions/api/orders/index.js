import { jsonResponse, requireAuth } from "../../_lib/auth.js";
import { newId } from "../../_lib/id.js";

function rowToOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    notes: row.notes,
    items: JSON.parse(row.items || "[]"),
    totalSar: row.total_sar,
    status: row.status,
    moyasarPaymentId: row.moyasar_payment_id,
    createdAt: row.created_at,
  };
}

// POST /api/orders — ينشئ طلب "قيد الانتظار" قبل الدفع (عام، يستدعى من صفحة الدفع)
export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));

  if (!body.customerName || !body.phone || !body.city || !body.address) {
    return jsonResponse({ error: "الرجاء تعبئة بيانات التوصيل كاملة" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonResponse({ error: "السلة فارغة" }, { status: 400 });
  }

  const total = body.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  if (!(total > 0)) {
    return jsonResponse({ error: "قيمة الطلب غير صحيحة" }, { status: 400 });
  }

  const id = newId("order");
  await env.DB.prepare(
    `INSERT INTO orders (id, customer_name, phone, city, address, notes, items, total_sar, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  )
    .bind(id, body.customerName, body.phone, body.city, body.address, body.notes ?? "", JSON.stringify(body.items), total)
    .run();

  return jsonResponse({ id, totalSar: total }, { status: 201 });
}

// GET /api/orders — لوحة التحكم فقط
export async function onRequestGet(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env } = context;
  const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return jsonResponse({ orders: results.map(rowToOrder) });
}
