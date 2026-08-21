import { updateCartBadge } from "./cart.js";

export const CATEGORIES = [
  { slug: "kids", name: "فساتين الأطفال", icon: "👗", desc: "فساتين شعبية للبنوتات" },
  { slug: "youth", name: "فساتين الشابات", icon: "✨", desc: "موديلات عصرية بلمسة تراثية" },
  { slug: "elders", name: "فساتين كبار السن", icon: "🧕", desc: "قصّات مريحة وأقمشة فاخرة" },
  { slug: "rose-shirts", name: "قمصان الروز", icon: "🌹", desc: "قمصان بيتية بطبعات الورد" },
];

const HEADER_HTML = `
<header class="site-header">
  <div class="header-inner">
    <a href="/index.html" class="brand">
      <span class="brand-badge">🌸</span>
      <span data-store-name>بسطة الوالدة</span>
    </a>
    <nav class="main-nav">
      ${CATEGORIES.map((c) => `<a href="/category.html?cat=${c.slug}">${c.name}</a>`).join("")}
    </nav>
    <div class="header-actions">
      <a href="/cart.html" class="cart-link">🛍️ السلة <span class="cart-count" data-cart-count>0</span></a>
    </div>
  </div>
</header>
<div class="sadu-bar"></div>
`;

const FOOTER_HTML = `
<footer class="site-footer">
  <div class="footer-inner">
    <div>
      <h4 data-store-name>بسطة الوالدة</h4>
      <p>بضاعة شعبية أصيلة من قلب السوق الشعبي — فساتين للكبار والصغار وقمصان الروز.</p>
    </div>
    <div>
      <h4>روابط سريعة</h4>
      ${CATEGORIES.map((c) => `<p><a href="/category.html?cat=${c.slug}">${c.name}</a></p>`).join("")}
    </div>
    <div>
      <h4>تواصلي معنا</h4>
      <p>واتساب: <a href="https://wa.me/966500000000" target="_blank" rel="noopener">اضغطي هنا للتواصل</a></p>
      <p>الدفع آمن عبر مدى وابل وابل واببل باي</p>
    </div>
  </div>
  <div class="footer-bottom">© <span data-year></span> جميع الحقوق محفوظة</div>
</footer>
`;

export function renderLayout() {
  const headerMount = document.querySelector("#site-header");
  const footerMount = document.querySelector("#site-footer");
  if (headerMount) headerMount.innerHTML = HEADER_HTML;
  if (footerMount) footerMount.innerHTML = FOOTER_HTML;

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  updateCartBadge();

  fetch("/api/config")
    .then((r) => r.json())
    .then((cfg) => {
      document.querySelectorAll("[data-store-name]").forEach((el) => (el.textContent = cfg.storeName));
      window.__NAJDI_CONFIG__ = cfg;
    })
    .catch(() => {});
}

export function categoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || slug;
}

document.addEventListener("DOMContentLoaded", renderLayout);
