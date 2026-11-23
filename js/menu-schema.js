// ============================================================================
// MENU RULES: one source of truth for the board (index.html), the client editor
// (admin/Editor.html) and the editor's save script (admin/Code.gs).
//
// Everything between the SCHEMA-JSON markers must stay plain JSON (double quotes,
// no comments, no trailing commas): Code.gs downloads this file and parses that part.
//
// Sections: where an item appears on a board. "match" rules are checked in order
// (lowercase text): cat = Category equals, catHas / catNot = Category contains / doesn't,
// nameHas / nameNot = ItemName contains / doesn't. New items get the section's "category".
// min / max: item counts that fit the hand-designed layout at 1920x1080 without
// scrolling (measured), so the client can't overcrowd or empty a board.
// ============================================================================
if (typeof window === "undefined") globalThis.window = globalThis; // lets Node tests load this file

window.MENU_SCHEMA = /* SCHEMA-JSON-START */ {
  "version": 1,
  "boards": [
    {
      "key": "Pizza & Wings",
      "label": "Pizza & Wings",
      "sections": [
        { "id": "pizza", "label": "Cheese Pizza", "category": "Cheese Pizza", "min": 2, "max": 5,
          "match": [{ "catHas": "pizza", "catNot": "combo" }] },
        { "id": "wings", "label": "Wings", "category": "Wings & Sauces", "min": 2, "max": 5,
          "match": [{ "catHas": "wing", "catNot": "combo", "nameNot": "combo" }] },
        { "id": "cheesy", "label": "Cheesy Bread", "category": "Cheesy Bread", "min": 2, "max": 5,
          "match": [{ "catHas": "cheesy" }] },
        { "id": "combos", "label": "Combos", "category": "Pizza & Wing Combos", "min": 1, "max": 4, "photo": true,
          "match": [{ "catHas": "combo" }] }
      ]
    },
    {
      "key": "Platters & Favorites",
      "label": "Platters & Favorites",
      "sections": [
        { "id": "platters", "label": "Platters", "category": "Platters", "min": 2, "max": 7,
          "match": [{ "cat": "platters" }] },
        { "id": "burgers", "label": "Burgers", "category": "Burgers", "min": 2, "max": 6,
          "match": [{ "cat": "burgers" }, { "catHas": "sandwich", "nameHas": "burger" }] },
        { "id": "dominican", "label": "Dominican Favorites", "category": "Dominican Favorites", "min": 2, "max": 6,
          "match": [{ "catHas": "dominican" }] },
        { "id": "tacos", "label": "Tacos & Quesadillas", "category": "Tacos & Quesadillas", "min": 2, "max": 6,
          "match": [{ "catHas": "taco" }, { "catHas": "quesadilla" }] },
        { "id": "sandwiches", "label": "Sandwiches & Wraps", "category": "Sandwiches", "min": 2, "max": 6,
          "match": [{ "cat": "sandwiches" }, { "catHas": "sandwich", "nameNot": "burger" }, { "catHas": "wrap" }] }
      ]
    },
    {
      "key": "Smoothies & Healthy",
      "label": "Smoothies & Healthy",
      "sections": [
        { "id": "fruit", "label": "Fruit Smoothies", "category": "Fruit Smoothies", "min": 2, "max": 6,
          "match": [{ "catHas": "fruit" }] },
        { "id": "protein", "label": "Protein Smoothies", "category": "Protein Smoothies", "min": 2, "max": 12,
          "note": "The first 6 go in the Protein Smoothies column, the rest in Fitness & Power.",
          "match": [{ "catHas": "protein" }] },
        { "id": "salads", "label": "Salads", "category": "Fresh Salads", "min": 2, "max": 5,
          "match": [{ "catHas": "salad" }] }
      ]
    }
  ],
  "limits": {
    "name": 32,
    "description": 90,
    "badge": 16,
    "comboOption": 30,
    "tickerLabel": 18,
    "tickerText": 80,
    "tickerPrice": 12,
    "tickerMin": 1,
    "tickerMax": 8,
    "tvMax": 3
  },
  "statuses": ["Active", "Sold Out", "Hidden"],
  "settings": [
    { "key": "SmoothieSmall", "label": "Fruit smoothie: Small (16oz)", "group": "Smoothie sizes", "type": "price", "default": "$5.99" },
    { "key": "SmoothieMedium", "label": "Fruit smoothie: Medium (20oz)", "group": "Smoothie sizes", "type": "price", "default": "$6.99" },
    { "key": "SmoothieLarge", "label": "Fruit smoothie: Large (24oz)", "group": "Smoothie sizes", "type": "price", "default": "$7.99" },
    { "key": "ProteinSmall", "label": "Protein smoothie: Small (16oz)", "group": "Smoothie sizes", "type": "price", "default": "$8.00" },
    { "key": "ProteinMedium", "label": "Protein smoothie: Medium (20oz)", "group": "Smoothie sizes", "type": "price", "default": "$9.00" },
    { "key": "ProteinLarge", "label": "Protein smoothie: Large (24oz)", "group": "Smoothie sizes", "type": "price", "default": "$10.00" },
    { "key": "ExtraProteinPrice", "label": "Add extra whey protein", "group": "Add-ons", "type": "price", "default": "+$1.50" },
    { "key": "SeedsOatsPrice", "label": "Add chia seeds, flax & oats", "group": "Add-ons", "type": "price", "default": "+$1.00" },
    { "key": "ToppingPrice", "label": "Pizza topping (each)", "group": "Add-ons", "type": "price", "default": "$2.50" },
    { "key": "DrinkPrice", "label": "Add a drink", "group": "Add-ons", "type": "price", "default": "+$2.00" },
    { "key": "EmpanadaPrice", "label": "Empanada deal", "group": "Empanadas", "type": "text", "max": 16, "default": "2 for $5.00" },
    { "key": "EmpanadaFlavors", "label": "Empanada flavors (separate with commas)", "group": "Empanadas", "type": "text", "max": 80, "default": "Chicken, Beef, Cheese, Ham & Cheese, Pizza" },
    { "key": "WeatherCity", "label": "City name under the weather", "group": "Store location", "type": "text", "max": 20, "default": "NEW YORK, NY" },
    { "key": "WeatherLat", "label": "Latitude", "group": "Store location", "type": "number", "default": "40.7128" },
    { "key": "WeatherLon", "label": "Longitude", "group": "Store location", "type": "number", "default": "-74.0060" },
    { "key": "TVCount", "label": "Number of TVs", "group": "TVs", "type": "tvcount", "default": "3" },
    { "key": "TV1Boards", "label": "TV 1 shows", "group": "TVs", "type": "boards", "default": "Pizza & Wings" },
    { "key": "TV2Boards", "label": "TV 2 shows", "group": "TVs", "type": "boards", "default": "Platters & Favorites" },
    { "key": "TV3Boards", "label": "TV 3 shows", "group": "TVs", "type": "boards", "default": "Smoothies & Healthy" },
    { "key": "SpotlightMenuSeconds", "label": "Show the menu for (seconds)", "group": "Spotlight", "type": "seconds", "min": 20, "max": 600, "default": "90" },
    { "key": "SpotlightPerBreak", "label": "Spotlight photos per break", "group": "Spotlight", "type": "count", "min": 1, "max": 8, "default": "2" },
    { "key": "SpotlightPhotoSeconds", "label": "Show each spotlight photo for (seconds)", "group": "Spotlight", "type": "seconds", "min": 4, "max": 30, "default": "8" }
  ],
  "photos": [
    { "file": "assets/food/combo1.jpg", "label": "Combo: pizza, wings & 2L" },
    { "file": "assets/food/combo2.jpg", "label": "Combo: large pie & wings" },
    { "file": "assets/food/combo3.jpg", "label": "Combo: two pies & wings" },
    { "file": "assets/food/combo4.jpg", "label": "Combo: cheesy bread & wings" },
    { "file": "assets/food/board1_pizza_wings.jpg", "label": "Pizza & wings" },
    { "file": "assets/food/pizza_slice_pull.jpg", "label": "Cheese pizza pull" },
    { "file": "assets/food/wings_garlic_parm.jpg", "label": "Garlic parm wings" },
    { "file": "assets/food/wings_honey_bbq.jpg", "label": "Honey BBQ wings" },
    { "file": "assets/food/wings_cutout.png", "label": "Glazed wings" },
    { "file": "assets/food/deluxe_burger_pure.jpg", "label": "Deluxe burger" },
    { "file": "assets/food/cuban_sandwich.jpg", "label": "Cuban sandwich" },
    { "file": "assets/food/dominican_mofongo.jpg", "label": "Mofongo & pernil" },
    { "file": "assets/food/tacos_quesadillas.jpg", "label": "Tacos & quesadillas" },
    { "file": "assets/food/smoothies_5_cups_flat_lids.jpg", "label": "Smoothie cups" },
    { "file": "assets/food/empanadas_crispy.jpg", "label": "Empanadas" },
    { "file": "assets/food/sodas_ice_cold.jpg", "label": "Ice cold sodas" }
  ]
} /* SCHEMA-JSON-END */;

// Which section an item belongs to (null = it has no place on any board).
window.MENU_SCHEMA_sectionOf = function (item, schema) {
  schema = schema || window.MENU_SCHEMA;
  const cat = String(item.Category || "").trim().toLowerCase();
  const name = String(item.ItemName || "").trim().toLowerCase();
  const boardKey = String(item.Board || "").trim().toLowerCase();
  for (const board of schema.boards) {
    if (board.key.toLowerCase() !== boardKey) continue;
    for (const section of board.sections) {
      const hit = section.match.some(rule =>
        (rule.cat === undefined || cat === rule.cat) &&
        (rule.catHas === undefined || cat.includes(rule.catHas)) &&
        (rule.catNot === undefined || !cat.includes(rule.catNot)) &&
        (rule.nameHas === undefined || name.includes(rule.nameHas)) &&
        (rule.nameNot === undefined || !name.includes(rule.nameNot)));
      if (hit) return { board, section };
    }
  }
  return null;
};

if (typeof module !== "undefined") module.exports = { schema: window.MENU_SCHEMA, sectionOf: window.MENU_SCHEMA_sectionOf };
