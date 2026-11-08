# Foreman

A walkable 3D study aid for the Victorian domestic builder (unlimited) exam. Stages 1 (permits, contract, site establishment) and 2 (footings and slab-on-ground) are built; the other 16 are planned on the master plan.

Each built stage has a 3D walk and orbit view, zoomable exploded detail models with labelled components, 2D drawings, step-by-step actions, trades, materials and suppliers, quotes to obtain, inspections, exam cards and pointers to the owner's own study notes. Every fact carries a Verified, Typical or Confirm flag and a source.

## Run it

The modules need a web server, so `file://` will not work: `npx serve foreman` or `python3 -m http.server -d foreman`. three.js 0.186.0 loads from jsDelivr.

## Notes

- Study aid only, not legal, engineering or surveying advice. Check current figures against the Act, the NCC and the Standards.
- The 3D engine follows the CloudAI-X threejs-skills repository (MIT) and uses three.js (MIT).
- Course material from the owner's Builders Academy notes and quiz bank is not stored in this repository, which is public. `plan.js` holds module and section titles only.
