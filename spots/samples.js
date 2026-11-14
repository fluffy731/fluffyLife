// Sample places for trying the app without a Google key, and for the tests. Deterministic: the same search
// gives the same places. Every name starts with "Sample" and every place is marked sample: true.
import { kindOf } from "./model.js";

const NOUNS = {
  eat: ["noodle bar", "bistro", "dumpling house", "pizzeria", "ramen shop", "taqueria", "grill", "Thai kitchen", "diner", "pho house", "tapas bar", "curry house"],
  drink: ["wine bar", "rooftop bar", "cocktail lounge", "pub", "brewery", "jazz bar"],
  coffee: ["café", "espresso bar", "bakery café", "brunch spot"],
  sights: ["lookout", "gallery", "garden", "museum", "heritage walk", "pier"],
  activities: ["mini golf", "climbing gym", "arcade", "cinema", "bowling alley", "escape room"],
  dessert: ["gelato bar", "dessert café", "patisserie", "waffle bar"],
};
const RANGES = [null, [10, 20], [20, 40], [40, 80], [80, null]];

function seed(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rng(a) { return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const every = (oh, om, ch, cm) => ({ periods: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  open: { day: d, hour: oh, minute: om }, close: { day: ch * 60 + cm <= oh * 60 + om ? (d + 1) % 7 : d, hour: ch, minute: cm } })) });
const split = () => ({ periods: [0, 1, 2, 3, 4, 5, 6].flatMap((d) => [
  { open: { day: d, hour: 11, minute: 30 }, close: { day: d, hour: 14, minute: 30 } },
  { open: { day: d, hour: 17, minute: 30 }, close: { day: d, hour: 22, minute: 0 } }]) });
const allDay = () => ({ periods: [{ open: { day: 0, hour: 0, minute: 0 }, close: null }] });

function hoursFor(kind, i) {
  if (i % 9 === 8) return null; // some places don't publish hours
  switch (kind) {
    case "coffee": return every(7, 0, 15, 0);
    case "eat": return i % 7 === 3 ? allDay() : i % 4 === 1 ? every(17, 0, 3, 0) : split();
    case "drink": return i % 3 === 0 ? every(16, 0, 3, 0) : every(16, 0, 1, 0);
    case "sights": return every(9, 0, 17, 0);
    case "activities": return every(10, 0, 22, 0);
    default: return i % 3 === 0 ? every(12, 0, 1, 0) : every(12, 0, 23, 0); // dessert
  }
}

function makePlace(kind, i, r, center, radiusKm, tag) {
  const k = kindOf(kind), nouns = NOUNS[k.id];
  const dist = Math.sqrt(r()) * radiusKm * 0.8, ang = r() * 2 * Math.PI;
  const lat = center.lat + (dist * Math.cos(ang)) / 111.2;
  const lng = center.lng + (dist * Math.sin(ang)) / (111.2 * Math.cos((center.lat * Math.PI) / 180));
  const price = k.priced && i % 5 !== 4 ? 1 + Math.floor(r() * 4) : null;
  const range = price ? RANGES[price] : null;
  return {
    id: `sample-${tag}-${i}`, name: `Sample ${nouns[i % nouns.length]} ${i + 1}`, kind: k.id, type: k.id, address: "Sample address", area: "Sample area",
    lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5,
    rating: Math.round((3.8 + r()) * 10) / 10, ratingCount: 20 + Math.floor(r() * 1980),
    price, priceRange: range ? { from: range[0], to: range[1], currency: "AUD" } : null,
    hours: hoursFor(k.id, i), off: null, photo: null, mapsUrl: null, summary: null, reviews: [], sample: true,
  };
}

export function sampleProvider() {
  return {
    label: "Sample data",
    async search({ query, kind, center, radiusKm, max = 12 }) {
      const tag = seed(`${query}|${kind}|${center.lat.toFixed(3)}|${center.lng.toFixed(3)}`).toString(36);
      const r = rng(seed(tag));
      return Array.from({ length: Math.min(max, 12) }, (_, i) => makePlace(kind, i, r, center, Math.min(radiusKm, 50), tag));
    },
    async details(p) {
      return { ...p,
        summary: { text: "Sample summary: people like the generous portions and friendly staff; a few say it gets loud on weekends.", disclosure: "Sample text, not real reviews" },
        reviews: [
          { text: "Sample review: worth the trip, we'll be back.", rating: 5, author: "Sample reviewer", when: "a week ago" },
          { text: "Sample review: good, but busy at peak times.", rating: 4, author: "Sample reviewer", when: "a month ago" },
        ] };
    },
  };
}
