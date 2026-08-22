-- ترقية لقاعدة بيانات منشورة مسبقاً: إضافة عمود رابط موقع التوصيل لجدول الطلبات
ALTER TABLE orders ADD COLUMN location_url TEXT;
