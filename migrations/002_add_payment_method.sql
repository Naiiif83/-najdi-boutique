-- ترقية لقاعدة بيانات منشورة مسبقاً: إضافة طريقة الدفع (دفع إلكتروني / عند الاستلام)
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'online';
