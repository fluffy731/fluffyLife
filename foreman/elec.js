// Shared layout for Step 9 (electrical and data rough-in), so the 3D scene and the plan drawing agree.
// Every position is illustrative. Real positions come from the endorsed plans, the electrician's circuit schedule and the distributor's rules.
import { WALLS, wallInfo, wallMembers, worldAt } from './frame.js';

export const BOARD = { x: 5.62, y: 1.05, z: 10.3, w: 0.42, h: 1.2, d: 0.16 };   // meter box and main switchboard on the east wall, door facing east
export const PIT = [6.4, 17.0];                       // electricity service pit at the front boundary
export const TEMP = [5.8, 14.2];                      // temporary supply post
export const STOCK = [6.5, 3.0];                      // cable, conduit and boxes delivered here, in the east margin
export const HUB = [-1.0, 5.425];                     // data hub on the north face of the wall at z = 5.5
export const TELCO = [-0.6, 17.0];                    // telecommunications pit and lead-in
export const ALARMS = [[-1.0, 3.2, 'Hall'], [2.6, 2.75, 'Bedroom'], [0.0, 7.5, 'Living']];
// First floor: one alarm on the landing beside the stairwell, so each storey has its own and the plan view (ground floor) is unchanged.
export const ALARMS_UP = [[-2.0, 7.4, 'Landing']];
export const LIGHTS = [[-3.5, -3.8], [0, -3.8], [3.5, -3.8], [-3.5, -1.5], [0, -1.5], [3.5, -1.5], [-3.6, 3.4], [2.6, 2.75], [-3.0, 8.4], [0.5, 8.4], [3.5, 8.4], [0.5, 10.2]];

// Power points, switches and cable runs on every wall, found from the same wall data the frames are built from.
export function outlets() {
  const gpo = [], sw = [], runs = [], tops = [];
  for (const raw of WALLS) {
    const w = wallInfo(raw), zs = wallMembers(w.len, w.open).zones.slice().sort((p, q) => p.l - q.l);
    const spans = []; let at = 0.15;
    for (const z of zs) { spans.push([at, z.l - 0.3]); at = z.r + 0.3; }
    spans.push([at, w.len - 0.15]);
    for (const [a, b] of spans) {
      if (b - a < 0.5) continue;
      runs.push({ w, a, b });
      if (b - a > 1.0) gpo.push({ w, u: (a + b) / 2, pos: worldAt(w, (a + b) / 2, 0.3, 0.06) });
    }
    for (const z of zs) if (z.o.sill === 0) sw.push({ w, u: z.r + 0.28, pos: worldAt(w, z.r + 0.28, 1.1, 0.06) });
    tops.push({ w });
  }
  return { gpo, sw, runs, tops };
}
