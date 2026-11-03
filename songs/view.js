// The ♪ Songs tab of the Korean app. app.js creates it through pack.songs and routes every
// [data-s] click and every change event here first.
import { openSongs } from "./db.js";

export function createSongs(c) {
  const { esc } = c;
  let store = null, storeError = false, loaded = false;
  let songs = [];                       // in memory, so Export can run inside the tap (iOS share sheet)
  const ui = { view: "list" };

  openSongs().then((s) => s.all().then((all) => { store = s; songs = all; }))
    .catch(() => { storeError = true; })
    .finally(() => { loaded = true; if (c.tab() === "songs") c.render(); });

  function listHTML() {
    if (storeError) return `<div class="songs"><div class="card empty"><b>Songs can't be saved on this device</b>This browser has blocked its storage (a private window, or website data turned off). The rest of the app still works.</div></div>`;
    if (!loaded) return `<div class="songs"><div class="small muted">Loading…</div></div>`;
    const buttons = `<div class="actions"><button class="btn primary" data-s="add">+ Add song</button><button class="btn" data-s="import">Import list</button></div>`;
    if (!songs.length) return `<div class="songs"><div class="card empty"><b>No songs yet</b>Add a song you listen to, or import your list.${buttons}</div></div>`;
    return `<div class="songs">${buttons}<div class="list" style="margin-top:12px">${songs.map((s) => `<div class="item" data-s="open" data-id="${esc(s.id)}"><div class="row"><b>${esc(s.title)}</b></div><div class="meta">${esc(s.artist)}</div></div>`).join("")}</div></div>`;
  }

  return {
    render: () => listHTML(),
    click: () => false,
    change: () => false,
    settingsHTML: () => "",
    exportSongs: () => songs.slice(),
    importSongs: async () => 0,
  };
}
