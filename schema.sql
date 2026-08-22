-- قاعدة بيانات متجر الوالدة (Cloudflare D1)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- kids | youth | elders | rose-shirts
  price_sar REAL NOT NULL,
  compare_at_price REAL,            -- سعر قبل الخصم (اختياري)
  description TEXT,
  sizes TEXT NOT NULL DEFAULT '[]', -- JSON: ["S","M","L"] أو مقاسات أعمار
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT NOT NULL DEFAULT '[]',    -- JSON: مصفوفة روابط صور عادية
  frames_360 TEXT NOT NULL DEFAULT '[]',-- JSON: مصفوفة روابط صور الدوران 360 مرتبة
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  location_url TEXT,                -- رابط موقع التوصيل على خرائط قوقل (اختياري)
  notes TEXT,
  items TEXT NOT NULL,              -- JSON: [{productId,name,price,size,qty,image}]
  total_sar REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | cancelled
  moyasar_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- تسجيل محاولات دخول لوحة التحكم الفاشلة (لحماية من محاولات التخمين المتكررة)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, created_at);
