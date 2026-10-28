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
      ["Passport (valid 6+ months past your return date)", "overseas"],
      ["Visa / ETA / ESTA checked for each country", "overseas"],
      ["Travel insurance: policy and emergency number saved on phone", "overseas"],
      ["Flight and accommodation bookings (offline copies)", "overseas domestic"],
      "Driver licence/IDP",
      ["Card - make sure international", "overseas"],
      "Cash",
      ["身份証/回鄉証", "overseas"],
      ["China bank devices", "overseas"],
      "Medicare",
      ["Passport photo page saved to cloud / emailed to yourself", "overseas"],
    ],
    long: [
      "Backup card kept separate from wallet",
      ["Register trip on Smartraveller", "overseas"],
      ["Frequent flyer / hotel loyalty numbers", "overseas domestic"],
    ],
  },
  {
    title: "Road trip",
    icon: "🚗",
    trips: ["road"],
    always: [
      "Accommodation / campsite bookings",
      "Rego current and roadside assistance number saved",
      "Toll account / e-tag topped up",
      "Fuel up (or charge) before you leave",
      "Tyres (incl. spare), oil and water checked",
      "Car phone charger and phone mount",
      "Water and snacks for the drive",
      "Playlist / podcasts downloaded",
      "Rubbish bag for the car",
    ],
    long: [
      "Esky and ice",
      "Jumper leads",
      "Torch",
      "Paper map for no-reception stretches",
      "Car serviced before the trip",
    ],
  },
  {
    title: "Phone & tech",
    icon: "🔌",
    always: [
      "Chargers and correct connector",
      "Portable charger (carry-on only, not checked bag)",
      ["Travel adapter (check the plug type)", "overseas"],
      "AirPods + wired earphones",
      ["SIM roaming setup", "overseas"],
      "Gimbal/action",
      "Offline maps downloaded",
    ],
    long: [
      "Laptop / tablet and charger",
      "Multi-port USB charger",
      "Spare cables",
    ],
  },
  {
    title: "Clothes",
    icon: "👕",
    always: [
      "Clothes enough for # of days",
      "Underwear",
      "Socks",
      "Tops",
      "Pants / shorts",
      "Pyjamas",
      "Jacket or warm layer",
      "Comfortable walking shoes",
      "Swimgear",
      "Flip flop",
      "Hat",
      "Sunglasses",
    ],
    long: [
      "One smart outfit",
      "Second pair of shoes",
      "Layers for a different climate",
      "Laundry bag",
    ],
  },
  {
    title: "Toiletries & health",
    icon: "🧴",
    always: [
      "Toothbrush and toothpaste",
      "Deodorant",
      "Skincare and sunscreen",
      // Australian domestic flights have no liquids limit; international ones do.
      ["Liquids under 100 mL, in one clear resealable bag", "overseas"],
      "Medicine/supplements (prescriptions in original packaging, with script)",
      "Glasses / contacts",
      "Shavers",
      "Nail clippers",
      "Brush comb",
      "Hair wax CAR",
      "Pimple cream",
      "Perfume",
      "Bug repellent",
    ],
    long: [
      "Basic first aid kit (pain relief, bandaids, antihistamine)",
      "Enough medicine for the whole trip plus a few days",
      "Hand sanitiser and tissues",
    ],
  },
  {
    title: "Carry-on comfort",
    icon: "✈️",
    trips: ["overseas", "domestic"],
    always: [
      "Empty water bottle (fill after security)",
      ["Pen for arrival cards", "overseas"],
      "Book",
      "Snacks",
    ],
    long: [
      "Neck pillow and eye mask",
      "Change of clothes in carry-on",
      "Compression socks",
    ],
  },
  {
    title: "Before you leave home",
    icon: "🏠",
    always: [
      ["Online check-in done", "overseas domestic"],
      ["Check Smartraveller advice for destination", "overseas"],
      "Bins out",
      "Fridge cleared of anything that will spoil",
      "Windows and doors locked",
      "Plants watered",
    ],
    long: [
      "Australia Post Hold Mail arranged",
      "Bills on auto-pay",
      "Pet / plant care arranged",
      "Pause subscriptions you won't use",
      "Hot water and non-essential power points off",
      "Spare key with someone you trust",
    ],
  },
];
