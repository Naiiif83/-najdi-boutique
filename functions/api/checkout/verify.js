// GET /api/checkout/verify?order_id=...&id=...  — رابط الرجوع (callback) من Moyasar بعد محاولة الدفع.
// يتحقق من حالة الدفع مباشرة من سيرفرات Moyasar (لا يثق بالباراميترات القادمة من المتصفح)
// ثم يحدّث حالة الطلب في قاعدة البيانات ويحوّل الزائر لصفحة النتيجة المناسبة.

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const paymentId = url.searchParams.get("id");

  const redirect = (path) => Response.redirect(new URL(path, url.origin), 302);

  if (!orderId || !paymentId) {
    return redirect("/checkout.html?error=missing");
  }

  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (!order) {
    return redirect("/checkout.html?error=order_not_found");
  }

  if (!env.MOYASAR_SECRET_KEY) {
    return redirect(`/checkout.html?order_id=${orderId}&error=payment_not_configured`);
  }

  // التحقق الفعلي من الدفعة عبر Moyasar API (Basic Auth بالمفتاح السري)
  const authHeader = "Basic " + btoa(`${env.MOYASAR_SECRET_KEY}:`);
  const payRes = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
    headers: { Authorization: authHeader },
  });

  if (!payRes.ok) {
    return redirect(`/checkout.html?order_id=${orderId}&error=verify_failed`);
  }

  const payment = await payRes.json();
  const paidAmountSar = payment.amount / 100;
  const isPaid = payment.status === "paid";
  const amountMatches = Math.abs(paidAmountSar - order.total_sar) < 0.01;

  if (isPaid && amountMatches) {
    await env.DB.prepare(
      "UPDATE orders SET status='paid', moyasar_payment_id=?, updated_at=datetime('now') WHERE id=?"
    )
      .bind(paymentId, orderId)
      .run();
    return redirect(`/order-confirmation.html?order=${orderId}`);
  }

  await env.DB.prepare(
    "UPDATE orders SET status='failed', moyasar_payment_id=?, updated_at=datetime('now') WHERE id=?"
  )
    .bind(paymentId, orderId)
    .run();
  return redirect(`/checkout.html?order_id=${orderId}&error=payment_failed`);
}
