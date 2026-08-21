export async function guardAdmin() {
  const res = await fetch("/api/admin/session");
  const { authenticated } = await res.json();
  if (!authenticated) {
    location.href = "/admin/login.html";
    return false;
  }
  return true;
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (res.status === 401) {
    location.href = "/admin/login.html";
    throw new Error("غير مصرح");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حدث خطأ");
  return data;
}

export const CATEGORY_OPTIONS = [
  { slug: "kids", name: "فساتين الأطفال" },
  { slug: "youth", name: "فساتين الشابات" },
  { slug: "elders", name: "فساتين كبار السن" },
  { slug: "rose-shirts", name: "قمصان الروز" },
];
