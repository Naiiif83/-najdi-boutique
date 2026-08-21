// مكوّن عرض 360 درجة — يسحب المستخدم بإصبعه أو الماوس فيدور المنتج بين الصور المحمّلة مسبقاً
export function mountViewer360({ mountEl, frames, fallbackImages, productName }) {
  mountEl.innerHTML = "";

  const hasSpin = Array.isArray(frames) && frames.length >= 3;
  const gallery = hasSpin ? frames : fallbackImages && fallbackImages.length ? fallbackImages : ["/img/placeholder.svg"];

  const viewer = document.createElement("div");
  viewer.className = "viewer-360";

  const img = document.createElement("img");
  img.src = gallery[0];
  img.alt = productName || "صورة المنتج";
  img.draggable = false;
  viewer.appendChild(img);

  let hint = null;
  if (hasSpin) {
    hint = document.createElement("div");
    hint.className = "viewer-hint";
    hint.innerHTML = "↔️ اسحبي للتدوير 360°";
    viewer.appendChild(hint);
  }

  mountEl.appendChild(viewer);

  // شريط الصور المصغّرة أسفل العارض
  const thumbsRow = document.createElement("div");
  thumbsRow.className = "thumbs-row";
  gallery.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    t.className = i === 0 ? "active" : "";
    t.addEventListener("click", () => setFrame(i));
    thumbsRow.appendChild(t);
  });
  mountEl.appendChild(thumbsRow);

  let currentIndex = 0;
  function setFrame(i) {
    currentIndex = ((i % gallery.length) + gallery.length) % gallery.length;
    img.src = gallery[currentIndex];
    [...thumbsRow.children].forEach((t, idx) => t.classList.toggle("active", idx === currentIndex));
  }

  if (!hasSpin) return; // معرض صور عادي فقط، بدون سحب دوراني

  // تحميل مسبق لجميع الإطارات لتفادي الوميض أثناء السحب
  gallery.forEach((src) => {
    const preload = new Image();
    preload.src = src;
  });

  let dragging = false;
  let startX = 0;
  let startIndex = 0;
  const DEG_PER_FRAME = 10; // كل 10px سحب = إطار واحد (يمكن تعديلها)

  function onDown(x) {
    dragging = true;
    startX = x;
    startIndex = currentIndex;
    viewer.style.cursor = "grabbing";
    if (hint) hint.style.opacity = "0";
  }
  function onMove(x) {
    if (!dragging) return;
    const delta = x - startX;
    const framesMoved = Math.round(delta / DEG_PER_FRAME);
    setFrame(startIndex - framesMoved);
  }
  function onUp() {
    dragging = false;
    viewer.style.cursor = "grab";
  }

  viewer.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onUp);

  viewer.addEventListener(
    "touchstart",
    (e) => onDown(e.touches[0].clientX),
    { passive: true }
  );
  viewer.addEventListener(
    "touchmove",
    (e) => onMove(e.touches[0].clientX),
    { passive: true }
  );
  viewer.addEventListener("touchend", onUp);
}
