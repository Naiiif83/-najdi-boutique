import { jsonResponse, requireAuth } from "../../_lib/auth.js";
import { newId } from "../../_lib/id.js";

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

// GET /api/products?category=kids&includeInactive=1
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const includeInactive = url.searchParams.get("includeInactive") === "1";

  let sql = "SELECT * FROM products";
  const conditions = [];
  const params = [];
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (!includeInactive) {
    conditions.push("is_active = 1");
  }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY created_at DESC";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse({ products: results.map(rowToProduct) });
}

// POST /api/products  (لوحة التحكم فقط)
export async function onRequestPost(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { env, request } = context;
  const body = await request.json();

  if (!body.name || !body.category || typeof body.priceSar !== "number") {
    return jsonResponse({ error: "الاسم والتصنيف والسعر مطلوبة" }, { status: 400 });
  }

  const id = newId("prod");
  await env.DB.prepare(
    `INSERT INTO products (id, name, category, price_sar, compare_at_price, description, sizes, stock, images, frames_360, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      body.category,
      body.priceSar,
      body.compareAtPrice ?? null,
      body.description ?? "",
      JSON.stringify(body.sizes ?? []),
      body.stock ?? 0,
      JSON.stringify(body.images ?? []),
      JSON.stringify(body.frames360 ?? []),
      body.isActive === false ? 0 : 1
    )
    .run();

  return jsonResponse({ id }, { status: 201 });
}
