# Foreman

A walkable 3D study aid for the Victorian domestic builder (unlimited) exam. Stages 1 (permits, contract, site establishment), 2 (footings and slab-on-ground), 3 (wall framing), 4 (roof framing and trusses), 5 (roof cladding, gutters and stormwater), 6 (external walls), 7 (windows, doors and lock-up), 8 (plumbing and drainage rough-in), 9 (electrical and data rough-in), 10 (wet areas and waterproofing), 11 (insulation and energy efficiency), 12 (internal linings), 13 (fix-out: joinery, stairs and balustrades), 14 (tiling and floor coverings), 15 (painting and the final fix), 16 (bushfire and fire safety), 17 (external works) and 18 (completion, occupancy and handover) are built, so all 18 stages on the master plan are built.

Each built stage has a 3D walk and orbit view, zoomable exploded detail models with labelled components, 2D drawings, step-by-step actions, trades, materials and suppliers, quotes to obtain, inspections, exam cards and pointers to the owner's own study notes, plus NCC 2025 links (Housing Provisions section and Volume Two part) on every stage. Every fact carries a Verified, Typical or Confirm flag and a source.

## Run it

The modules need a web server, so `file://` will not work: `npx serve foreman` or `python3 -m http.server -d foreman`. three.js 0.186.0 loads from jsDelivr.

## Movement

Drag to look, click the ground to walk there, press a pin to glide to its stop, use the stop arrows, or WASD / arrow keys (Shift to run, E to open a pin). Touch has a joystick. `?` reopens the controls guide. Graphics has Standard and High (ambient occlusion) settings.

## Notes

- Framing and truss figures are flagged Typical or Confirm: AS 1684, AS 4440, AS 1720.5 and AS 4055 are paywalled and were not opened. Check them and the truss manufacturer's layout before relying on a number.

- Study aid only, not legal, engineering or surveying advice. Check current figures against the Act, the NCC and the Standards.
- The 3D engine follows the CloudAI-X threejs-skills repository (MIT) and uses three.js (MIT).
- Course material from the owner's Builders Academy notes and quiz bank is not stored in this repository, which is public. `plan.js` holds module and section titles only.
