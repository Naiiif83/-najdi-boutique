import { jsonResponse, requireAuth } from "../../_lib/auth.js";

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    priceSar: row.price_sar,
    compareAtPrice: row.compare_at_price,
    description: row.description,
    sizes: JSON.parse(row.sizes || "[]"),
    stock: row.stock,
    images: JSON.parse(row.images || "[]"),
    frames360: JSON.parse(row.frames_360 || "[]"),
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

// GET /api/products/:id
export async function onRequestGet(context) {
  const { env, params } = context;
  const row = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(params.id).first();
  if (!row) return jsonResponse({ error: "المنتج غير موجود" }, { status: 404 });
  return jsonResponse({ product: rowToProduct(row) });
}

// PUT /api/products/:id  (لوحة التحكم فقط)
export async function onRequestPut(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env, params, request } = context;
  const body = await request.json();

  const existing = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(params.id).first();
  if (!existing) return jsonResponse({ error: "المنتج غير موجود" }, { status: 404 });

  await env.DB.prepare(
    `UPDATE products SET name=?, category=?, price_sar=?, compare_at_price=?, description=?, sizes=?, stock=?, images=?, frames_360=?, is_active=?, updated_at=datetime('now')
     WHERE id=?`
  )
    .bind(
      body.name,
      body.category,
      body.priceSar,
      body.compareAtPrice ?? null,
      body.description ?? "",
      JSON.stringify(body.sizes ?? []),
      body.stock ?? 0,
      JSON.stringify(body.images ?? []),
      JSON.stringify(body.frames360 ?? []),
      body.isActive === false ? 0 : 1,
      params.id
    )
    .run();

  return jsonResponse({ ok: true });
}

// DELETE /api/products/:id  (لوحة التحكم فقط)
export async function onRequestDelete(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env, params } = context;
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  return jsonResponse({ ok: true });
}
