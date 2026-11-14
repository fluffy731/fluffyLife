# Foreman

A walkable 3D study aid for the Victorian domestic builder (unlimited) exam. Stages 1 (permits, contract, site establishment), 2 (footings and slab-on-ground), 3 (wall framing), 4 (roof framing and trusses), 5 (roof cladding, gutters and stormwater), 6 (external walls), 7 (windows, doors and lock-up), 8 (plumbing and drainage rough-in), 9 (electrical and data rough-in), 10 (wet areas and waterproofing), 11 (insulation and energy efficiency), 12 (internal linings), 13 (fix-out: joinery, stairs and balustrades), 14 (tiling and floor coverings), 15 (painting and the final fix), 16 (bushfire and fire safety), 17 (external works) and 18 (completion, occupancy and handover) are built, so all 18 stages on the master plan are built.

Each built stage has a 3D walk and orbit view, zoomable exploded detail models with labelled components, 2D drawings, step-by-step actions, trades, materials and suppliers, quotes to obtain, inspections, exam cards and pointers to the owner's own study notes, plus NCC 2025 links (Housing Provisions section and Volume Two part) on every stage. Every fact carries a Verified, Typical or Confirm flag and a source.

Under the 3D view:

- **Section cut** slices the house across, along or in plan with a slider. Cut solids are filled and hatched like a section drawing (brick, concrete, earth, timber, insulation). The ground, street and neighbours are never cut.
- **Find the defects** swaps non-compliant work into the scene for a phase (for example weepholes mortared up). Click or tap the spot; Show me reveals the rest. Each defect explains what is wrong and what compliant work looks like. Defects are in `hunt-a.js` (stages 1 to 6), `hunt-b.js` (7 to 12) and `hunt-c.js` (13 to 18); the format is at the top of `hunt.js`.
- **Photo render** path-traces the current view with three-gpu-pathtracer into a photo-quality still you can save as a PNG. It needs a reasonable graphics card and takes 10 to 60 seconds.

The **Real world** tab lists the official and manufacturer documents for each stage (`refs.js`): NCC parts, regulator guides and installation guides, with where to look in each. They are links only. NCC figures sit outside the NCC's CC BY 4.0 licence, and regulator and manufacturer guides are copyright, so none is copied into this public repo. Below them, real-site photos load live from Wikimedia Commons (`photos.js` holds file titles only); `commons.js` shows only CC0, public domain, CC BY and CC BY-SA files, with the author and licence Commons gives.

Drawings carry material hatching and a title block, applied in `dwg.js`, so every drawing picks them up. Stage 4 has a truss heel detail and stage 6 a slab edge detail at about 1:5.

## Run it

The modules need a web server, so `file://` will not work: `npx serve foreman` or `python3 -m http.server -d foreman`. three.js 0.187.0, three-mesh-bvh 0.9.18 and three-gpu-pathtracer 0.0.28 load from jsDelivr (the path tracer only when Photo render is pressed).

## Movement

Drag to look, click the ground to walk there, press a pin to glide to its stop, use the stop arrows, or WASD / arrow keys (Shift to run, E to open a pin). Touch has a joystick. `?` reopens the controls guide. Graphics has Standard and High (ambient occlusion) settings.

## Notes

- Framing and truss figures are flagged Typical or Confirm: AS 1684, AS 4440, AS 1720.5 and AS 4055 are paywalled and were not opened. Check them and the truss manufacturer's layout before relying on a number.

- Study aid only, not legal, engineering or surveying advice. Check current figures against the Act, the NCC and the Standards.
- The 3D engine follows the CloudAI-X threejs-skills repository (MIT) and uses three.js (MIT). Photo render uses three-gpu-pathtracer (MIT).
- Lighting: a physically based sky (three.js Sky) and image-based light from Poly Haven's park HDRI (CC0), the 512 px copy from the @pmndrs/assets package (CC0), stored as `env/park.exr`. Trees are leaf-card foliage and gravel is instanced stones, both generated in code.
- Course material from the owner's Builders Academy notes and quiz bank is not stored in this repository, which is public. `plan.js` holds module and section titles only.
