// Check-in photos: a small JPEG copy (600 px) per stamp in IndexedDB. The originals stay in the Photos app.
const DB = "spots-photos", STORE = "photos";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode), store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => { db.close(); resolve(req && req.result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export const putPhoto = (id, blob) => tx("readwrite", (s) => s.put(blob, id));
export const getPhoto = (id) => tx("readonly", (s) => s.get(id)).then((b) => b || null).catch(() => null);
export const delPhoto = (id) => tx("readwrite", (s) => s.delete(id)).catch(() => {});

export const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob);
});
export const dataURLToBlob = (url) => fetch(url).then((r) => r.blob());

export async function photosAsDataURLs(ids) {
  const out = {};
  for (const id of ids) { const b = await getPhoto(id); if (b) out[id] = await blobToDataURL(b); }
  return out;
}

// Resize to fit 600 px and re-encode as JPEG, so each stamp photo stays around 60 KB.
export async function thumb(file, max = 600) {
  const img = await (typeof createImageBitmap === "function" ? createImageBitmap(file) : new Promise((resolve, reject) => {
    const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = URL.createObjectURL(file);
  }));
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/jpeg", 0.8));
}
