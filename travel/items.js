// Packing list. Edit freely.
// Each section has `always` (every trip) and `long` (shown only in Long trip mode).
// An item is plain text, shown on every trip type, or [text, "trip ids"] to show it only on those trip types,
// e.g. ["Passport", "overseas"] or ["Online check-in done", "overseas domestic"].
// A section with `trips: [...]` only appears on those trip types.
// Ticks are remembered by the item's wording, so rewording an item clears its tick; nothing else breaks.
// Items you add on the phone (＋ Add in the app) are kept in that browser and are not written here.
export const TRIPS = [
  { id: "overseas", label: "Overseas" },
  { id: "domestic", label: "Domestic" },
  { id: "road", label: "Road trip" },
];

export const SECTIONS = [
  {
    title: "Documents & money",
    icon: "🛂",
    always: [
      ["Passport", "overseas"],
      ["Visa (if the country needs one)", "overseas"],
      "Driver licence/IDP",
      ["Card - make sure international", "overseas"],
      "Cash",
      ["身份証/回鄉証", "overseas"],
      ["China bank devices", "overseas"],
      "Medicare",
    ],
    long: [],
  },
  {
    title: "Road trip",
    icon: "🚗",
    trips: ["road"],
    always: [
      "Fuel up (or charge) before you leave",
      "Tyres (incl. spare) checked",
      "Car phone charger and mount",
      "Toll e-tag",
    ],
    long: [
      "Esky",
      "Jumper leads",
      "Car serviced",
    ],
  },
  {
    title: "Phone & tech",
    icon: "🔌",
    always: [
      "Chargers and correct connector",
      "Portable charger",
      ["Travel adapter", "overseas"],
      "AirPods + wired earphones",
      ["SIM roaming setup", "overseas"],
      "Gimbal/action",
    ],
    long: [
      "Laptop / tablet and charger",
    ],
  },
  {
    title: "Clothes",
    icon: "👕",
    always: [
      "Clothes enough for # of days",
      "Pyjamas",
      "Jacket",
      "Swimgear",
      "Flip flop",
      "Hat",
      "Sunglasses",
    ],
    long: [
      "Second pair of shoes",
    ],
  },
  {
    title: "Toiletries & health",
    icon: "🧴",
    always: [
      "Toothbrush and toothpaste",
      "Retainer",
      "Skincare and sunscreen",
      "Medicine/supplements",
      "Shavers",
      "Nail clippers",
      "Brush comb",
      "Hair wax CAR",
      "Pimple cream",
      "Perfume",
      "Bug repellent",
    ],
    long: [],
  },
  {
    title: "Carry-on",
    icon: "✈️",
    trips: ["overseas", "domestic"],
    always: [
      "Book",
    ],
    long: [
      "Neck pillow and eye mask",
    ],
  },
  {
    title: "Before you leave home",
    icon: "🏠",
    always: [
      "Fridge cleared",
      "Windows and doors locked",
    ],
    long: [
      "Australia Post Hold Mail",
    ],
  },
];
