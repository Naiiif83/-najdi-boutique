import { jsonResponse, requireAuth } from "../../_lib/auth.js";
import { newId } from "../../_lib/id.js";

function rowToOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    locationUrl: row.location_url,
    notes: row.notes,
    items: JSON.parse(row.items || "[]"),
    totalSar: row.total_sar,
    paymentMethod: row.payment_method,
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

  // الأسعار والأسماء تُقرأ من قاعدة البيانات مباشرة (لا يُعتمد على القيم القادمة من المتصفح)
  // لمنع التلاعب بالسعر عبر تعديل الطلب المرسل من العميل.
  const items = [];
  for (const raw of body.items) {
    const qty = Math.floor(Number(raw?.qty));
    if (!raw?.productId || !Number.isFinite(qty) || qty < 1 || qty > 50) {
      return jsonResponse({ error: "بيانات السلة غير صحيحة" }, { status: 400 });
    }
    const product = await env.DB.prepare("SELECT id, name, price_sar, images, frames_360, is_active FROM products WHERE id = ?")
      .bind(raw.productId)
      .first();
    if (!product || !product.is_active) {
      return jsonResponse({ error: `أحد المنتجات في السلة لم يعد متوفراً` }, { status: 400 });
    }
    const images = JSON.parse(product.images || "[]");
    const frames = JSON.parse(product.frames_360 || "[]");
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price_sar,
      size: typeof raw.size === "string" ? raw.size.slice(0, 60) : null,
      qty,
      image: images[0] || frames[0] || null,
    });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (!(total > 0)) {
    return jsonResponse({ error: "قيمة الطلب غير صحيحة" }, { status: 400 });
  }

  let locationUrl = null;
  if (typeof body.locationUrl === "string" && /^https:\/\/(www\.)?(google\.com\/maps|maps\.google\.com|goo\.gl\/maps)/.test(body.locationUrl)) {
    locationUrl = body.locationUrl.slice(0, 300);
  }

  const paymentMethod = body.paymentMethod === "cod" ? "cod" : "online";
  const status = paymentMethod === "cod" ? "cod" : "pending";

  const id = newId("order");
  await env.DB.prepare(
    `INSERT INTO orders (id, customer_name, phone, city, address, location_url, notes, items, total_sar, payment_method, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      String(body.customerName).slice(0, 200),
      String(body.phone).slice(0, 40),
      String(body.city).slice(0, 120),
      String(body.address).slice(0, 500),
      locationUrl,
      body.notes ? String(body.notes).slice(0, 500) : "",
      JSON.stringify(items),
      total,
      paymentMethod,
      status
    )
    .run();

  // طلبات الدفع عند الاستلام مؤكدة فوراً (بدون خطوة دفع إلكتروني)، فنخصم المخزون مباشرة
  if (paymentMethod === "cod") {
    for (const item of items) {
      await env.DB.prepare("UPDATE products SET stock = MAX(stock - ?, 0), updated_at=datetime('now') WHERE id = ?")
        .bind(item.qty, item.productId)
        .run();
    }
  }

  return jsonResponse({ id, totalSar: total, paymentMethod }, { status: 201 });
}

// GET /api/orders — لوحة التحكم فقط
export async function onRequestGet(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env } = context;
  const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return jsonResponse({ orders: results.map(rowToOrder) });
}
