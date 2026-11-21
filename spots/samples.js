// Sample places for trying the app without a Google key, and for the tests. Deterministic: the same search
// gives the same places. Every name starts with "Sample" and every place is marked sample: true.
import { kindOf, CBD, CUISINES } from "./model.js";

const NOUNS = {
  eat: ["noodle bar", "bistro", "dumpling house", "pizzeria", "ramen shop", "taqueria", "grill", "Thai kitchen", "diner", "pho house", "tapas bar", "curry house"],
  drink: ["wine bar", "rooftop bar", "cocktail lounge", "pub", "brewery", "jazz bar"],
  coffee: ["café", "espresso bar", "bakery café", "brunch spot"],
  sights: ["lookout", "gallery", "garden", "museum", "heritage walk", "pier"],
  activities: ["mini golf", "climbing gym", "arcade", "cinema", "bowling alley", "escape room"],
  dessert: ["gelato bar", "dessert café", "patisserie", "waffle bar"],
  nature: ["park", "botanic garden", "walking trail", "nature reserve", "lake walk", "bushland trail"],
  beach: ["beach", "bay beach", "foreshore", "surf beach"],
};
// Google-style types for the sample restaurants, so cuisines work in sample mode. A cuisine search ("Korean restaurant")
// gets places of that cuisine, as Google's search would.
const EAT_TYPES = ["chinese_restaurant", "restaurant", "chinese_restaurant", "italian_restaurant", "japanese_restaurant", "mexican_restaurant",
  "restaurant", "thai_restaurant", "restaurant", "vietnamese_restaurant", "restaurant", "indian_restaurant"];
const CUISINE_NOUNS = {
  cantonese: ["yum cha house", "roast duck shop", "congee kitchen", "dim sum parlour"],
  chinese: ["dumpling house", "noodle bar", "Sichuan kitchen", "hand-pulled noodles"],
  korean: ["BBQ house", "fried chicken", "tofu house", "bibimbap kitchen"],
  japanese: ["ramen shop", "sushi train", "izakaya", "udon house"],
  thai: ["Thai kitchen", "pad thai bar", "larb house", "curry kitchen"],
  vietnamese: ["pho house", "banh mi bar", "bun cha kitchen", "rice paper rolls"],
  malaysian: ["laksa house", "nasi lemak kitchen", "roti canai bar", "char kway teow stall"],
  indian: ["curry house", "dosa kitchen", "tandoori grill", "thali house"],
  italian: ["pizzeria", "pasta bar", "trattoria", "osteria"],
  greek: ["souvlaki bar", "taverna", "gyros house", "meze kitchen"],
  mexican: ["taqueria", "burrito bar", "cantina", "taco house"],
  middleeast: ["falafel bar", "shawarma house", "mezze kitchen", "kebab grill"],
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
  if (i % 9 === 8 || ((kind === "nature" || kind === "beach") && i % 2 === 0)) return null; // some places don't publish hours (parks and beaches often)
  switch (kind) {
    case "coffee": return every(7, 0, 15, 0);
    case "eat": return i % 7 === 3 ? allDay() : i % 4 === 1 ? every(17, 0, 3, 0) : split();
    case "drink": return i % 3 === 0 ? every(16, 0, 3, 0) : every(16, 0, 1, 0);
    case "sights": return every(9, 0, 17, 0);
    case "activities": return every(10, 0, 22, 0);
    case "nature": case "beach": return allDay();
    default: return i % 3 === 0 ? every(12, 0, 1, 0) : every(12, 0, 23, 0); // dessert
  }
}

function makePlace(kind, i, r, center, radiusKm, tag, cuisine = null) {
  const k = kindOf(kind), nouns = cuisine ? CUISINE_NOUNS[cuisine.id] : NOUNS[k.id];
  const dist = Math.sqrt(r()) * radiusKm * 0.8, ang = r() * 2 * Math.PI;
  const lat = center.lat + (dist * Math.cos(ang)) / 111.2;
  const lng = center.lng + (dist * Math.sin(ang)) / (111.2 * Math.cos((center.lat * Math.PI) / 180));
  const price = k.priced && i % 5 !== 4 ? 1 + Math.floor(r() * 4) : null;
  const range = price ? RANGES[price] : null;
  return {
    id: `sample-${tag}-${i}`, name: `Sample ${nouns[i % nouns.length]} ${i + 1}`, kind: k.id,
    type: cuisine ? cuisine.types[0] || "chinese_restaurant" : k.id === "eat" ? EAT_TYPES[i % EAT_TYPES.length] : k.id, address: "Sample address", area: "Sample area",
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
      const cuisine = kind === "eat" ? CUISINES.find((c) => query.includes(c.query)) || null : null;
      return Array.from({ length: Math.min(max, 12) }, (_, i) => makePlace(kind, i, r, center, Math.min(radiusKm, 50), tag, cuisine));
    },
    // A made-up spot within about 8 km of the CBD, always the same for the same words.
    async locate(query) {
      const r = rng(seed(`where|${query.toLowerCase().trim()}`));
      const d = 1 + r() * 7, a = r() * 2 * Math.PI;
      return { id: `sample-where-${seed(query).toString(36)}`, name: query.trim(), address: "Sample address", area: "Sample area", sample: true,
        lat: Math.round((CBD.lat + (d * Math.cos(a)) / 111.2) * 1e5) / 1e5, lng: Math.round((CBD.lng + (d * Math.sin(a)) / 88.2) * 1e5) / 1e5 };
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
