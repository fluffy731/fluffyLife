// Find the defects: stage-by-stage defect sets for the 3D view, merged from hunt-a.js (stages 1-6), hunt-b.js (7-12) and hunt-c.js (13-18).
// Each defect: { id, phase (0-based index into the stage's phases), title, pos: [x, y, z] metres (also where its pin goes), r (find radius, m),
//   box?: [[x0, y0, z0], [x1, y1, z1]] (optional find zone instead of a radius round pos, for long defects; r then adds a margin, use 0.3),
//   hint, explain (what is wrong and why it matters), fix (what compliant work looks like), flag ('V' | 'T' | 'C'), src (SOURCES key or ''),
//   build?(kit) -> Object3D (the defective work, added only while hunting), hide?: [object names hidden while hunting] }.
// Plain data and kit-only builders, so the tests can load it without three.js.
import a from './hunt-a.js';
import b from './hunt-b.js';
import c from './hunt-c.js';

export const HUNT = { ...a, ...b, ...c };
export const huntPhases = (n) => [...new Set((HUNT[n] || []).map((d) => d.phase))].sort((x, y) => x - y);
export const huntFor = (n, phase) => (HUNT[n] || []).filter((d) => d.phase === phase);
