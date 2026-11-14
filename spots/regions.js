// Day-trip regions for "Tomorrow" (centre points; searches look within about 15 km of each).
export const REGIONS = [
  { id: "yarra-valley", name: "Yarra Valley", lat: -37.66, lng: 145.45, blurb: "Wineries, Healesville and the hills, about an hour east." },
  { id: "dandenongs", name: "Dandenong Ranges", lat: -37.86, lng: 145.35, blurb: "Forest walks, Puffing Billy and tearooms." },
  { id: "mornington", name: "Mornington Peninsula", lat: -38.38, lng: 144.95, blurb: "Beaches, hot springs and wineries." },
  { id: "phillip-island", name: "Phillip Island", lat: -38.48, lng: 145.23, blurb: "Penguins, surf beaches and the Nobbies." },
  { id: "daylesford", name: "Daylesford and Hepburn", lat: -37.34, lng: 144.14, blurb: "Mineral springs, cafés and the lake." },
  { id: "great-ocean-road", name: "Great Ocean Road", lat: -38.42, lng: 144.18, blurb: "The surf coast from Torquay to Lorne." },
  { id: "bellarine", name: "Bellarine and Queenscliff", lat: -38.22, lng: 144.62, blurb: "Seaside towns, ferries and wineries." },
  { id: "macedon", name: "Macedon Ranges", lat: -37.37, lng: 144.56, blurb: "Hanging Rock, Mount Macedon and village bakeries." },
  { id: "ballarat", name: "Ballarat", lat: -37.56, lng: 143.85, blurb: "Sovereign Hill, Lake Wendouree and the goldfields." },
  { id: "werribee", name: "Werribee", lat: -37.92, lng: 144.67, blurb: "Open Range Zoo, the mansion and the river." },
];

// A region you haven't been to lately; if every region is recent, any of them.
export function surpriseRegion(recentIds = [], rand = Math.random) {
  const fresh = REGIONS.filter((r) => !recentIds.includes(r.id));
  const pool = fresh.length ? fresh : REGIONS;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}
