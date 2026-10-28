// Packing list. Edit freely: each section has `always` (every trip) and `long` (shown only in Long trip mode).
// Ticks are remembered by the item's wording, so rewording an item clears its tick; nothing else breaks.
// Items you add on the phone (＋ Add in the app) are kept in that browser and are not written here.
export const SECTIONS = [
  {
    title: "Documents & money",
    icon: "🛂",
    always: [
      "Passport (valid 6+ months past your return date)",
      "Visa / ETA / ESTA checked for each country",
      "Travel insurance: policy and emergency number saved on phone",
      "Flight and accommodation bookings (offline copies)",
      "Driver licence",
      "Card with no foreign transaction fees",
      "A little local cash",
      "Passport photo page saved to cloud / emailed to yourself",
    ],
    long: [
      "International Driving Permit (if driving)",
      "Backup card kept separate from wallet",
      "Medicare card",
      "Register trip on Smartraveller",
      "Frequent flyer / hotel loyalty numbers",
    ],
  },
  {
    title: "Phone & tech",
    icon: "🔌",
    always: [
      "Phone and charging cable",
      "Power bank (carry-on only, not checked bag)",
      "Travel adapter (check the plug type)",
      "Earphones",
      "Roaming / eSIM set up",
      "Offline maps downloaded",
    ],
    long: [
      "Laptop / tablet and charger",
      "Multi-port USB charger",
      "Kindle / e-reader",
      "Spare cables",
    ],
  },
  {
    title: "Clothes",
    icon: "👕",
    always: [
      "Underwear",
      "Socks",
      "Tops",
      "Pants / shorts",
      "Sleepwear",
      "Jacket or warm layer",
      "Comfortable walking shoes",
      "Swimmers",
    ],
    long: [
      "One smart outfit",
      "Second pair of shoes",
      "Layers for a different climate",
      "Laundry bag",
      "Hat and sunglasses",
    ],
  },
  {
    title: "Toiletries & health",
    icon: "🧴",
    always: [
      "Toothbrush and toothpaste",
      "Deodorant",
      "Sunscreen",
      "Liquids under 100 mL, in one clear resealable bag",
      "Prescription medicine in original packaging, plus script or doctor's letter",
      "Glasses / contacts",
      "Razor",
    ],
    long: [
      "Basic first aid kit (pain relief, bandaids, antihistamine)",
      "Nail clippers (checked bag)",
      "Enough medicine for the whole trip plus a few days",
      "Hand sanitiser and tissues",
    ],
  },
  {
    title: "Carry-on comfort",
    icon: "✈️",
    always: [
      "Empty water bottle (fill after security)",
      "Pen for arrival cards",
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
      "Online check-in done",
      "Check Smartraveller advice for destination",
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
