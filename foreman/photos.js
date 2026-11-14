// Real-site photos per stage: Wikimedia Commons file titles only. Nothing is stored here.
// The app asks the Commons API for each file's thumbnail, author and licence when the tab opens, and shows only
// CC0, public domain, CC BY and CC BY-SA files, with the credit Commons gives. Chosen by web search on 13 November 2026.
export const PHOTOS_CHECKED = '13 November 2026';
export const PHOTOS = {
  1: [
    { file: 'File:Temporary Fencing.JPG', caption: 'Temporary fence panels around a site: the boundary must be secured before work starts to keep the public out.', where: 'Australia' },
    { file: 'File:Station number on a silt fence, Floyd County, GA.jpg', caption: 'A silt fence along the site edge: sediment control that keeps soil on the block and out of drains and waterways.', where: 'Floyd County, Georgia, USA' },
    { file: 'File:Construction site outhouse.JPG', caption: 'A portable toilet on a construction site; toilet facilities must be available for workers from day one.', where: '' },
  ],
  2: [
    { file: 'File:Concrete pumper.jpg', caption: 'A concrete pump takes concrete from the mixer truck and places it on the slab being poured.', where: '' },
    { file: 'File:Slab on grade.JPG', caption: 'Slab-on-ground construction, where the concrete slab is cast directly on the prepared ground.', where: '' },
  ],
  3: [
    { file: 'File:Timber frame house under construction, New Zealand.jpg', caption: 'A timber-framed house under construction; studs, plates, openings and bracing are all checked at the frame stage.', where: 'Johnsonville, Wellington, New Zealand' },
    { file: 'File:Light Framing Construction Picture.jpg', caption: 'Light timber framing assembled from prefabricated wall frames, the usual method on Australian project homes.', where: '' },
    { file: 'File:Wood-framed house.jpg', caption: 'A timber stud frame before cladding, showing how walls, plates and window and door openings fit together.', where: 'Katy, Texas, USA' },
  ],
  4: [
    { file: 'File:Wooden roof structure.jpg', caption: 'Prefabricated timber roof trusses with nail-plate joints, the kind supplied by a truss fabricator.', where: 'Finland' },
    { file: 'File:Hold-down-truss-connection.JPG', caption: 'A metal hold-down connecting a roof truss to the wall below, part of the tie-down path that resists wind uplift.', where: '' },
    { file: 'File:Wood truss plates.jpg', caption: 'Metal connector plates (nail plates) that join the timbers of factory-made roof trusses.', where: '' },
  ],
  5: [
    { file: 'File:Corrugated metal roof-2.jpg', caption: 'Corrugated metal roof sheeting fixed with screws through the sheets, a common Australian roof cladding.', where: '' },
    { file: 'File:-2020-02-28 Lead flashing around a chimney stack, Trimingham.JPG', caption: 'Lead flashing sealing the joint where a chimney passes through the roof, one of the main leak points to check.', where: 'Trimingham, Norfolk, UK' },
  ],
  6: [
    { file: 'File:Weep hole.jpg', caption: 'An open weep hole in place of a mortar joint, letting water that gets behind the brickwork drain out of the cavity.', where: '' },
    { file: 'File:Damp proof course - geograph.org.uk - 3592054.jpg', caption: 'A damp-proof course line in brickwork, there to stop moisture from the ground rising up the wall.', where: 'Burnham-on-Sea, UK' },
    { file: 'File:Cavity wall.JPG', caption: 'A cavity wall opened up: insulation bridging both leaves is poor practice, as the cavity must stay clear to drain.', where: '' },
    { file: 'File:Fiber cement siding.jpg', caption: 'Fibre cement cladding, a lightweight alternative to brick veneer on timber-framed houses.', where: '' },
  ],
  7: [],
  8: [
    { file: 'File:Laying sewer hi res (2).jpg', caption: 'PVC sewer pipe being laid in a trench; drains need the right grade and bedding, and a test before backfilling.', where: '' },
    { file: 'File:Shower project PEX connection 180 degree turn.jpg', caption: 'PEX water pipe run behind a shower wall; pressure test joints like these before linings cover them.', where: '' },
    { file: 'File:New flex hose connection links two three fourths inch copper pipes over a hot water heater.jpg', caption: 'Copper water pipes connected to a water heater with a flexible hose connector.', where: '' },
  ],
  9: [
    { file: 'File:Electrical-wiring-rough-in.jpg', caption: 'Rough-in stage: sheathed cables run through holes in the timber frame with metal protection plates, before any fittings.', where: '' },
    { file: 'File:Residential solar battery and main switchboard integration in Australia 01.jpg', caption: 'An Australian switchboard upgraded for rooftop solar and a battery, with main switches and separate distribution boards.', where: 'Australia' },
    { file: 'File:Smoke detector, Russia (11).jpg', caption: 'A ceiling-mounted smoke alarm; position matters, since smoke rises and spreads across the ceiling first.', where: 'Russia' },
  ],
  10: [],
  11: [
    { file: 'File:CSIRO ScienceImage 2175 Installing Insulation Batts.jpg', caption: 'Insulation batts being laid in a roof space; batts should fit snugly with no gaps and must not be squashed.', where: 'Australia' },
  ],
  12: [
    { file: 'File:Drywall.jpg', caption: 'Plasterboard (drywall), the standard lining fixed to wall and ceiling frames before joints are set and painted.', where: '' },
  ],
  13: [
    { file: 'File:Kitchen cabinets drawers installed.jpg', caption: 'Kitchen cabinets and drawers installed, with the carcasses fixed back to the wall framing so they stay level and secure.', where: '' },
  ],
  14: [
    { file: 'File:Applying grout.jpg', caption: 'Grout being worked into the joints of a newly tiled bathroom floor.', where: 'South Dakota, USA' },
  ],
  15: [
    { file: 'File:Kitchen renovation project cabinets finished microwave installed new floor painted walls and ceiling.JPG', caption: 'Cabinets fitted, floor laid and walls and ceiling painted: the finished standard checked on the final defects walk-through.', where: '' },
  ],
  16: [
    { file: 'File:2009 vic bushfire damage Yarra Glen 01.JPG', caption: 'A house damaged in the 2009 Black Saturday bushfires at Yarra Glen, a reminder of why BAL construction rules exist.', where: 'Yarra Glen, Victoria' },
    { file: 'File:Bushfire destroys house.jpg', caption: 'A house alight during a bushfire, the threat that AS 3959 construction for each BAL is designed to reduce.', where: '' },
  ],
  17: [
    { file: 'File:Retaining wall built with vertical I-beams and pressure treated lumber.JPG', caption: 'A treated timber retaining wall held by vertical steel posts; height and loading decide if a permit and engineer are needed.', where: '' },
    { file: 'File:Rebar lattice prior to the pouring of a concrete driveway.jpg', caption: 'Driveway reinforcement tied into a grid and lifted off the gravel base on plastic supports before the pour.', where: '' },
  ],
  18: [
    { file: 'File:New housing estate in Golden Bay, Western Australia, July 2023 05.jpg', caption: 'A new outer-suburban housing estate south of Perth, the typical setting for a project home handover.', where: 'Golden Bay, Western Australia' },
  ],
};
