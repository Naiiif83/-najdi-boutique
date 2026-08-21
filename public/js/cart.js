// إدارة السلة عبر localStorage — بدون حاجة لتسجيل دخول العميل
const CART_KEY = "najdi_cart_v1";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

export function addToCart(item) {
  const items = getCart();
  const existing = items.find((i) => i.productId === item.productId && i.size === item.size);
  if (existing) {
    existing.qty += item.qty;
  } else {
    items.push(item);
  }
  saveCart(items);
}

export function updateQty(productId, size, qty) {
  const items = getCart();
  const target = items.find((i) => i.productId === productId && i.size === size);
  if (!target) return;
  target.qty = Math.max(1, qty);
  saveCart(items);
}

export function removeFromCart(productId, size) {
  const items = getCart().filter((i) => !(i.productId === productId && i.size === size));
  saveCart(items);
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function updateCartBadge() {
  const badge = document.querySelector("[data-cart-count]");
  if (badge) badge.textContent = cartCount();
}
