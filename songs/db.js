// Songs are kept in IndexedDB on the phone (database fluffy-songs, store songs), not in localStorage:
// every fluffyLife app shares about 5 MB of localStorage on this origin, and translated songs add up.
export function openSongs(idb = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    if (!idb) return reject(new Error("nostorage"));
    let req;
    try { req = idb.open("fluffy-songs", 1); } catch { return reject(new Error("nostorage")); }
    req.onupgradeneeded = () => req.result.createObjectStore("songs", { keyPath: "id" });
    req.onerror = () => reject(new Error("nostorage"));
    req.onblocked = () => reject(new Error("nostorage"));
    req.onsuccess = () => resolve(wrap(req.result));
  });
}

function wrap(db) {
  const run = (mode, fn) => new Promise((resolve, reject) => {
    const tx = db.transaction("songs", mode);
    const r = fn(tx.objectStore("songs"));
    tx.oncomplete = () => resolve(r.result);
    tx.onerror = tx.onabort = () => reject(tx.error || new Error("nostorage"));
  });
  return {
    all: () => run("readonly", (s) => s.getAll()),
    put: (song) => run("readwrite", (s) => s.put(song)).then(() => {}),
    remove: (id) => run("readwrite", (s) => s.delete(id)).then(() => {}),
  };
}
