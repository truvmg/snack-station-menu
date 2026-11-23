/**
 * ============================================================================
 * SNACK STATION • OFFICIAL DIGITAL SIGNAGE MENU BOARD ENGINE
 * Custom Multi-Board Engine with TV-First Layouts & Horizontal Auto-Marquees
 * Optimized for 16:9 1080p/4K Commercial Displays & 24/7 Chromecast Playback
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSURDWNcAeXjzMQX94iooD03EwDfSfy50DyBOyogtt1r_aRGz2dRoy9jPSxwP3RJ2vCtYWZo_J-5Pc3/pub?output=csv";
const POLLING_INTERVAL_MS = 30000;
const ROTATE_INTERVAL_MS = 18000;
const BACKOFF_INITIAL_MS = 30000;
const BACKOFF_MAX_MS = 120000;
const BACKOFF_MULTIPLIER = 1.5;
const BURN_IN_INTERVAL_MS = 15 * 60 * 1000;
const STORAGE_KEY_CSV_URL = "snack_station_csv_url";
const STORAGE_KEY_MENU_CACHE = "snack_station_menu_cache";
const NIGHTLY_RELOAD_HOUR = 4;            // 4 AM local time
const RELOAD_RETRY_MS = 10 * 60 * 1000;   // retry in 10 min if the network is down

// Values shown on the boards that aren't individual menu items, plus the TV and
// spotlight setup. The list and defaults live in js/menu-schema.js ("settings"), shared
// with the client editor. Override any of them from the Google Sheet with a row whose
// Board column is "Settings": setting name in ItemName, value in Price (or Description).
const DEFAULT_SETTINGS = Object.fromEntries(window.MENU_SCHEMA.settings.map(s => [s.key, s.default]));

// Deals in the bottom scrolling ticker. Replace them from the Google Sheet with rows
// whose Board column is "Ticker": ItemName = label, Description = text, Price = highlighted price.
// Set Status to "Hidden" to switch a ticker row off without deleting it.
const DEFAULT_TICKER = [
  { label: "ADD A DRINK", text: "Ice Cold Coca-Cola, Sprite, or Fanta for only", price: "$2.00" },
  { label: "EMPANADA DEAL", text: "Hot Golden Stuffed Empanadas — 2 for only", price: "$5.00" },
  { label: "PIZZA TOPPINGS", text: "Pepperoni, Sausage, Bacon, Ham, Jalapeños, Corn & Extra Cheese for", price: "$2.50 ea" },
  { label: "PROTEIN BOOST", text: "11 Custom Blends with Whey Protein, Chia Seeds & Almond Milk", price: "" }
];

const BOARDS = [
  { id: 1, key: "Pizza & Wings", name: "PIZZA & WINGS", emoji: "🍕" },
  { id: 2, key: "Platters & Favorites", name: "PLATTERS & FAVORITES", emoji: "🥩" },
  { id: 3, key: "Smoothies & Healthy", name: "SMOOTHIES & PROTEIN SMOOTHIES", emoji: "🥤" }
];

// Complete authentic dataset matching the physical restaurant boards
const AUTHENTIC_MENU_DATA = [
  // Board 1: Pizza & Wings
  { Board: "Pizza & Wings", Category: "Cheese Pizza", ItemName: 'Personal (10")', Description: "Classic hand-tossed personal cheese pizza with savory tomato sauce", Price: "$6.00", Status: "Active", Badge: "Personal", ComboOption: "Toppings +$2.50 ea" },
  { Board: "Pizza & Wings", Category: "Cheese Pizza", ItemName: 'Medium (14")', Description: "Fresh tomato sauce and melted whole milk mozzarella", Price: "$10.99", Status: "Active", Badge: "Popular", ComboOption: "Toppings +$2.50 ea" },
  { Board: "Pizza & Wings", Category: "Cheese Pizza", ItemName: 'Large (16")', Description: "Family size hand-stretched crust with rich melted mozzarella", Price: "$16.00", Status: "Active", Badge: "Family Size", ComboOption: "Toppings +$2.50 ea" },
  { Board: "Pizza & Wings", Category: "Cheese Pizza", ItemName: 'Extra Large (18")', Description: "Giant authentic NY style thin crust pie, feeds 4-6", Price: "$19.99", Status: "Active", Badge: "Giant Pie", ComboOption: "Toppings +$2.50 ea" },
  { Board: "Pizza & Wings", Category: "Cheese Pizza", ItemName: "Jumbo NY Slice", Description: "Fresh hot slice of crispy cheese pizza baked daily", Price: "$2.99", Status: "Active", Badge: "Hot Slice", ComboOption: "" },
  { Board: "Pizza & Wings", Category: "Wings & Sauces", ItemName: "6 pcs Wings", Description: "Choice of sauce: Mild, Hot, BBQ, Garlic Parm, Honey BBQ, Lemon Pepper, Teriyaki", Price: "$7.99", Status: "Active", Badge: "Crispy", ComboOption: "Dip & Celery" },
  { Board: "Pizza & Wings", Category: "Wings & Sauces", ItemName: "10 pcs Wings", Description: "Choice of sauce: Mild, Hot, BBQ, Garlic Parm, Honey BBQ, Lemon Pepper, Teriyaki", Price: "$9.99", Status: "Active", Badge: "Popular", ComboOption: "Dip & Celery" },
  { Board: "Pizza & Wings", Category: "Wings & Sauces", ItemName: "12 pcs Wings", Description: "Choice of sauce: Mild, Hot, BBQ, Garlic Parm, Honey BBQ, Lemon Pepper, Teriyaki", Price: "$15.99", Status: "Active", Badge: "Chef's Pick", ComboOption: "Dip & Celery" },
  { Board: "Pizza & Wings", Category: "Wings & Sauces", ItemName: "20 pcs Wings", Description: "Party size crispy wings with up to 2 signature sauces", Price: "$25.99", Status: "Active", Badge: "Party Pack", ComboOption: "Dip & Celery" },
  { Board: "Pizza & Wings", Category: "Wings & Sauces", ItemName: "30 pcs Wings Party Pack", Description: "Jumbo celebration platter with choice of 3 signature sauces & dips", Price: "$36.99", Status: "Active", Badge: "Crowd Pleaser", ComboOption: "Dip & Celery" },
  { Board: "Pizza & Wings", Category: "Cheesy Bread", ItemName: "8 pcs Cheesy Bread", Description: "Melted mozzarella & garlic butter on golden baked artisan bread", Price: "$7.00", Status: "Active", Badge: "Fresh Baked", ComboOption: "San Marzano Marinara" },
  { Board: "Pizza & Wings", Category: "Cheesy Bread", ItemName: "Cheesy Bread w/ Bacon", Description: "Loaded with crispy smoked applewood bacon & melted mozzarella", Price: "$7.50", Status: "Active", Badge: "Popular", ComboOption: "" },
  { Board: "Pizza & Wings", Category: "Cheesy Bread", ItemName: "Cheesy Bread w/ Pepperoni", Description: "Topped with savory sliced pepperoni and extra golden mozzarella", Price: "$7.50", Status: "Active", Badge: "Favorite", ComboOption: "" },
  { Board: "Pizza & Wings", Category: "Cheesy Bread", ItemName: "Garlic Knots (6 pcs)", Description: "Oven-baked knotted dough tossed in garlic, herb butter & parmesan", Price: "$3.99", Status: "Active", Badge: "Fresh Baked", ComboOption: "Includes Marinara" },
  { Board: "Pizza & Wings", Category: "Pizza & Wing Combos", ItemName: "Combo 1", Description: "1 Medium Pie + 6 Wings + 2 Liter Soda", Price: "$19.99", Status: "Active", Badge: "Combo 1", ComboOption: "Feeds 2-3" },
  { Board: "Pizza & Wings", Category: "Pizza & Wing Combos", ItemName: "Combo 2", Description: "1 Large Pie + 12 Wings + 2 Liter Soda", Price: "$28.99", Status: "Active", Badge: "Combo 2", ComboOption: "Feeds 3-4" },
  { Board: "Pizza & Wings", Category: "Pizza & Wing Combos", ItemName: "Combo 3", Description: "2 Medium Pies (1 Topping Each) + 8 Wings + 2 Liter Soda", Price: "$29.99", Status: "Active", Badge: "Combo 3", ComboOption: "Feeds 4-5" },
  { Board: "Pizza & Wings", Category: "Pizza & Wing Combos", ItemName: "Combo 4", Description: "Cheesy Bread (8 pcs) + 6 Wings + 1 Can Soda", Price: "$14.99", Status: "Active", Badge: "Combo 4", ComboOption: "Personal Combo" },

  // Board 2: Platters & Favorites
  { Board: "Platters & Favorites", Category: "Platters", ItemName: "Grilled Chicken Platter", Description: "Marinated seasoned chicken breast. Includes: Rice, Beans, Salad & Plantains", Price: "$12.99", Status: "Active", Badge: "Healthy", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Platters", ItemName: "Steak Platter", Description: "Tender grilled seasoned steak. Includes: Rice, Beans, Salad & Plantains", Price: "$14.99", Status: "Active", Badge: "Popular", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Platters", ItemName: "Shrimp Platter", Description: "Succulent grilled garlic shrimp. Includes: Rice, Beans, Salad & Plantains", Price: "$16.99", Status: "Active", Badge: "Chef's Special", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Platters", ItemName: "Fish Platter", Description: "Golden seasoned fillet. Includes: Rice, Beans, Salad & Plantains", Price: "$14.99", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Dominican Favorites", ItemName: "Mofongo", Description: "Mashed green plantains seasoned with garlic, pork rinds & savory broth", Price: "$11.99", Status: "Active", Badge: "Authentic", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Dominican Favorites", ItemName: "Chimi", Description: "Dominican street burger with seasoned beef & shredded salsa slaw", Price: "$9.99", Status: "Active", Badge: "Street Favorite", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Dominican Favorites", ItemName: "Yaroa", Description: "Loaded fries or sweet plantain mash layered with meat & melted cheese", Price: "$10.99", Status: "Active", Badge: "Popular", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Dominican Favorites", ItemName: "Pernil", Description: "Slow-roasted marinated pork shoulder with crispy savory crackling", Price: "$11.99", Status: "Active", Badge: "Traditional", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Dominican Favorites", ItemName: "Sancocho", Description: "Hearty traditional meat and root vegetable stew served piping hot", Price: "$10.99", Status: "Active", Badge: "House Special", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Classic Burger", Description: "Seared beef patty, crisp lettuce, tomato, pickles & house sauce", Price: "$9.50", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Cheeseburger", Description: "Seared beef patty, American melted cheese, lettuce, tomato & pickles", Price: "$10.00", Status: "Active", Badge: "Popular", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Bacon Burger", Description: "Crispy smoked bacon, seared beef patty, cheddar, lettuce & tomato", Price: "$11.50", Status: "Active", Badge: "Chef's Pick", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Deluxe Burger", Description: "Double beef, double cheese, grilled sweet onions & signature sauce", Price: "$10.99", Status: "Active", Badge: "Signature", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Cuban Sandwich", Description: "Roast pernil, ham, Swiss cheese, pickles & mustard on pressed bread", Price: "$9.99", Status: "Active", Badge: "Authentic", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Chicken Sandwich", Description: "Grilled or crispy chicken breast with lettuce and tomato", Price: "$7.99", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Steak Sandwich", Description: "Thinly sliced seasoned steak, sautéed onions & melted cheese", Price: "$8.99", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Burgers & Sandwiches", ItemName: "Tuna Sandwich", Description: "Fresh seasoned tuna salad with crisp lettuce on toasted bread", Price: "$7.99", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Chicken Tacos (3)", Description: "Three soft tacos with seasoned chicken pico & crema", Price: "$10.00", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Beef Tacos (3)", Description: "Three seasoned beef tacos with fresh cilantro & sweet onions", Price: "$8.99", Status: "Active", Badge: "Popular", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Shrimp Tacos (3)", Description: "Three grilled shrimp tacos with cabbage slaw & chipotle crema", Price: "$13.00", Status: "Active", Badge: "Chef's Special", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Chicken Quesadilla", Description: "Grilled tortilla stuffed with seasoned chicken & melted blend cheese", Price: "$11.49", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Steak Quesadilla", Description: "Grilled tortilla packed with tender steak melted cheese & peppers", Price: "$12.00", Status: "Active", Badge: "Popular", ComboOption: "Add a Drink +$2.00" },
  { Board: "Platters & Favorites", Category: "Tacos & Quesadillas", ItemName: "Shrimp Quesadilla", Description: "Grilled seasoned shrimp and blend of melted cheeses", Price: "$13.50", Status: "Active", Badge: "", ComboOption: "Add a Drink +$2.00" },

  // Board 3: Smoothies & Healthy
  { Board: "Smoothies & Healthy", Category: "Fruit Smoothies", ItemName: "Mango Smoothie", Description: "Real sweet mango blended with crystal ice", Price: "$5.99", Status: "Active", Badge: "Refreshing", ComboOption: "Med $6.99 • Lrg $7.99" },
  { Board: "Smoothies & Healthy", Category: "Fruit Smoothies", ItemName: "Strawberry Smoothie", Description: "Fresh ripe strawberries chilled and blended to smooth perfection", Price: "$5.99", Status: "Active", Badge: "Popular", ComboOption: "Med $6.99 • Lrg $7.99" },
  { Board: "Smoothies & Healthy", Category: "Fruit Smoothies", ItemName: "Pineapple Smoothie", Description: "Tropical sweet pineapple crush blended icy cold", Price: "$5.99", Status: "Active", Badge: "Tropical", ComboOption: "Med $6.99 • Lrg $7.99" },
  { Board: "Smoothies & Healthy", Category: "Fruit Smoothies", ItemName: "Banana Smoothie", Description: "Creamy ripe bananas blended with ice and natural sweetness", Price: "$5.99", Status: "Active", Badge: "", ComboOption: "Med $6.99 • Lrg $7.99" },
  { Board: "Smoothies & Healthy", Category: "Fruit Smoothies", ItemName: "Create Your Own Smoothie", Description: "Choose any combination of up to 3 fresh fruits", Price: "$5.99", Status: "Active", Badge: "Custom", ComboOption: "Med $6.99 • Lrg $7.99" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Strawberry Glory", Description: "Banana, strawberry, oatmeal, vanilla protein & almond milk", Price: "$8.00", Status: "Active", Badge: "High Protein", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Mr. Green", Description: "Spinach, mango, banana, chia seed, vanilla protein & almond milk", Price: "$8.00", Status: "Active", Badge: "Superfood", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Kale and Spinach", Description: "Kale, spinach, mango, vanilla protein & almond milk", Price: "$8.00", Status: "Active", Badge: "Detox", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Bulkup Shake", Description: "Banana, oats, almond milk & honey with muscle protein", Price: "$8.00", Status: "Active", Badge: "Energy", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Nutella Gain", Description: "Nutella, banana, granola, honey, chocolate protein & almond milk", Price: "$8.00", Status: "Active", Badge: "Popular", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Peanut Butter Jelly", Description: "Blueberry, banana, peanut butter, vanilla protein & almond milk", Price: "$8.00", Status: "Active", Badge: "Chef's Pick", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Rocky Mountain", Description: "Banana, chocolate, protein, granola, peanut butter & almond milk", Price: "$8.00", Status: "Active", Badge: "Power", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Morirsoñando", Description: "Orange juice, almond milk, banana, oatmeal, honey & vanilla", Price: "$8.00", Status: "Active", Badge: "Dominican", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Fat Burner Shake", Description: "Strawberry, banana, fat burner supplement & crushed ice", Price: "$8.00", Status: "Active", Badge: "Fitness", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Tropical Island", Description: "Mango, pineapple, vanilla protein, orange juice & crushed ice", Price: "$8.00", Status: "Active", Badge: "", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Protein Smoothies", ItemName: "Peach Cream", Description: "Peaches, banana, almond milk & vanilla protein", Price: "$8.00", Status: "Active", Badge: "", ComboOption: "Med $9.00 • Lrg $10.00" },
  { Board: "Smoothies & Healthy", Category: "Fresh Salads", ItemName: "Grilled Chicken Salad", Description: "3 veggies, 1 cheese & 1 add-on over crisp garden greens", Price: "$10.99", Status: "Active", Badge: "Healthy", ComboOption: "Choice of Dressing" },
  { Board: "Smoothies & Healthy", Category: "Fresh Salads", ItemName: "Chicken Caesar Salad", Description: "Parm cheese, mozzarella, croutons, caesar dressing", Price: "$10.99", Status: "Active", Badge: "Classic", ComboOption: "House Made Croutons" },
  { Board: "Smoothies & Healthy", Category: "Fresh Salads", ItemName: "Grilled Chicken Avocado", Description: "Avocado, egg, tomatoes, toasted almonds, balsamic vinaigrette", Price: "$12.99", Status: "Active", Badge: "Chef's Special", ComboOption: "" },
  { Board: "Smoothies & Healthy", Category: "Fresh Salads", ItemName: "Grilled Shrimp Salad", Description: "Marinated grilled shrimp over garden salad with balsamic vinaigrette", Price: "$13.99", Status: "Active", Badge: "Seafood", ComboOption: "" },
  { Board: "Smoothies & Healthy", Category: "Fresh Salads", ItemName: "Fresh Salmon Salad", Description: "Pan-seared salmon fillet over crisp garden greens and cherry tomatoes", Price: "$14.99", Status: "Active", Badge: "Signature", ComboOption: "" },
  { Board: "Smoothies & Healthy", Category: "Empanadas", ItemName: "Empanadas (2 for $5.00)", Description: "Golden flaky pastry pockets. Choice: Chicken, Beef, Cheese, Ham & Cheese, Pizza", Price: "2 for $5.00", Status: "Active", Badge: "Snack Deal", ComboOption: "Fried Fresh to Order" }
];

const state = {
  currentData: JSON.parse(JSON.stringify(AUTHENTIC_MENU_DATA)),
  settings: { ...DEFAULT_SETTINGS },
  ticker: DEFAULT_TICKER.slice(),
  wakeLock: null,
  activeBoard: "Pizza & Wings",
  autoRotate: false,
  rotateTimer: null,
  rotateProgressInterval: null,
  rotateProgressStart: null,
  currentSheetUrl: GOOGLE_SHEET_CSV_URL,
  isSyncing: false,
  pollTimer: null,
  currentBackoffMs: BACKOFF_INITIAL_MS,
  burnInShiftIndex: 0,
  lastSyncTimestamp: null,
  mouseCursorVisible: false,
  tv: null,              // 1-3 when opened as index.html?tv=N
  rotationBoards: null   // boards this TV cycles through (null = all boards)
};

const BURN_IN_OFFSETS = [
  { x: 0, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 },
  { x: -1, y: -1 }, { x: 2, y: 0 }, { x: -2, y: 1 }, { x: 0, y: -2 }
];

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  loadMenuCache();
  initUrlParameters();
  initLiveClock();
  initLiveWeather();
  initAntiBurnIn();
  initTechPanel();
  initBoardTabs();
  initKioskSafeguards();
  renderTicker();
  renderActiveBoard();
  initDataSource();
  startSyncPolling();
  scheduleNightlyReload();
  startSpotlightCycle();
});

// ============================================================================
// OFFLINE CACHE: last menu successfully loaded from Google Sheets
// ============================================================================

function loadMenuCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MENU_CACHE);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (!cache || !Array.isArray(cache.items) || cache.items.length === 0) return;
    state.currentData = cache.items;
    state.settings = { ...DEFAULT_SETTINGS, ...(cache.settings || {}) };
    state.ticker = Array.isArray(cache.ticker) && cache.ticker.length ? cache.ticker : DEFAULT_TICKER.slice();
    state.promos = Array.isArray(cache.promos) ? cache.promos : [];
    if (cache.savedAt) {
      const syncEl = document.getElementById("last-sync-time");
      if (syncEl) syncEl.textContent = `Saved copy: ${new Date(cache.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
    }
  } catch (e) {
    // Corrupt or blocked storage: fall back to the built-in menu.
  }
}

function saveMenuCache() {
  try {
    localStorage.setItem(STORAGE_KEY_MENU_CACHE, JSON.stringify({
      items: state.currentData,
      settings: state.settings,
      ticker: state.ticker,
      promos: state.promos || [],
      savedAt: Date.now()
    }));
  } catch (e) {
    // Storage full or unavailable: the board still works, just without an offline copy.
  }
}

function setting(name) {
  const v = state.settings[name];
  return v !== undefined && v !== "" ? v : DEFAULT_SETTINGS[name];
}

function initUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get("screen") || params.get("board");
  const modeParam = params.get("mode");

  if (screenParam === "1" || screenParam === "pizza") {
    state.activeBoard = "Pizza & Wings";
    state.autoRotate = false;
  } else if (screenParam === "2" || screenParam === "platters") {
    state.activeBoard = "Platters & Favorites";
    state.autoRotate = false;
  } else if (screenParam === "3" || screenParam === "smoothies") {
    state.activeBoard = "Smoothies & Healthy";
    state.autoRotate = false;
  } else if (screenParam === "rotate" || modeParam === "rotate") {
    state.autoRotate = true;
  }

  // ?tv=1|2|3: this TV shows whatever the menu editor assigned to it (Settings rows TVCount, TV1Boards...).
  // ?screen= wins if both are given, so existing setups keep working.
  const tvParam = parseInt(params.get("tv"), 10);
  if (!screenParam && tvParam >= 1 && tvParam <= window.MENU_SCHEMA.limits.tvMax) {
    state.tv = tvParam;
    applyTvConfig();
  }

  updateBoardTabUI();
  updateBoardHeadline(state.activeBoard);
}

// ----------------------------------------------------------------------------
// PER-TV SETUP
// ----------------------------------------------------------------------------
const TV_SETTING_KEYS = ["TVCount", "TV1Boards", "TV2Boards", "TV3Boards"];

function boardKeyFromText(text) {
  const t = String(text || "").trim().toLowerCase();
  const board = BOARDS.find(b => b.key.toLowerCase() === t);
  return board ? board.key : null;
}

// Boards assigned to a TV; [] when that TV number is switched off.
function tvBoards(tv) {
  const count = Math.min(Math.max(parseInt(setting("TVCount"), 10) || 3, 1), window.MENU_SCHEMA.limits.tvMax);
  if (tv > count) return [];
  const list = String(setting(`TV${tv}Boards`) || "").split(",").map(boardKeyFromText).filter(Boolean);
  return list.length ? [...new Set(list)] : [BOARDS[(tv - 1) % BOARDS.length].key];
}

function applyTvConfig() {
  if (!state.tv) return;
  const boards = tvBoards(state.tv);
  state.rotationBoards = boards;
  const idle = document.getElementById("tv-idle");

  if (boards.length === 0) {
    stopAutoRotate();
    if (idle) {
      document.getElementById("tv-idle-note").textContent = `TV ${state.tv} is switched off in the menu editor (TV screens).`;
      idle.classList.add("is-visible");
      idle.setAttribute("aria-hidden", "false");
    }
    return;
  }
  if (idle) {
    idle.classList.remove("is-visible");
    idle.setAttribute("aria-hidden", "true");
  }

  if (boards.length > 1) {
    if (!boards.includes(state.activeBoard)) setActiveBoard(boards[0]);
    startAutoRotate();
  } else {
    stopAutoRotate();
    if (state.activeBoard !== boards[0]) setActiveBoard(boards[0]);
  }
}

function initBoardTabs() {
  const tabs = document.querySelectorAll(".board-tab[data-board]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      stopAutoRotate();
      setActiveBoard(tab.dataset.board);
    });
  });

  const rotateBtn = document.getElementById("tab-auto-rotate");
  if (rotateBtn) {
    rotateBtn.addEventListener("click", () => {
      if (state.autoRotate) stopAutoRotate();
      else startAutoRotate();
    });
  }
}

function updateBoardHeadline(boardKey) {
  const headlineEl = document.getElementById("board-headline");
  if (!headlineEl) return;
  const key = (boardKey || state.activeBoard || "").toLowerCase();
  if (key.includes("pizza")) {
    headlineEl.innerHTML = `<span style="color: #FF3B56;">PIZZA</span> <span style="color: #FFFFFF;">&amp;</span> <span style="color: #FACC15;">WINGS</span>`;
  } else if (key.includes("platter")) {
    headlineEl.innerHTML = `<span style="color: #FACC15;">PLATTERS</span> <span style="color: #FFFFFF;">&amp;</span> <span style="color: #4ADE80;">FAVORITES</span>`;
  } else {
    headlineEl.innerHTML = `<span style="color: #FF3B56;">SMOOTHIES</span> <span style="color: #FFFFFF;">&amp;</span> <span style="color: #38BDF8;">SHAKES</span>`;
  }
}

function setActiveBoard(boardKey) {
  state.activeBoard = boardKey;
  updateBoardTabUI();
  updateBoardHeadline(boardKey);

  const boardEl = document.getElementById("menu-board");
  if (boardEl) {
    boardEl.classList.add("cross-fade-out");
    setTimeout(() => {
      renderActiveBoard();
      boardEl.classList.remove("cross-fade-out");
    }, 180);
  } else {
    renderActiveBoard();
  }
}

function updateBoardTabUI() {
  const tabs = document.querySelectorAll(".board-tab[data-board]");
  tabs.forEach(tab => {
    if (tab.dataset.board === state.activeBoard && !state.autoRotate) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  const rotateBtn = document.getElementById("tab-auto-rotate");
  const progressBar = document.getElementById("rotate-progress-bar");
  if (rotateBtn) {
    if (state.autoRotate) {
      rotateBtn.classList.add("active");
      if (progressBar) progressBar.classList.remove("hidden");
    } else {
      rotateBtn.classList.remove("active");
      if (progressBar) progressBar.classList.add("hidden");
    }
  }

  const metricBoard = document.getElementById("metric-active-board");
  if (metricBoard) {
    metricBoard.textContent = state.autoRotate ? `Auto-Cycle (${state.activeBoard})` : state.activeBoard;
  }
}

function startAutoRotate() {
  state.autoRotate = true;
  updateBoardTabUI();
  scheduleNextRotation();
}

function stopAutoRotate() {
  state.autoRotate = false;
  if (state.rotateTimer) clearTimeout(state.rotateTimer);
  if (state.rotateProgressInterval) clearInterval(state.rotateProgressInterval);
  const progressBar = document.getElementById("rotate-progress-bar");
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.classList.add("hidden");
  }
  updateBoardTabUI();
}

function scheduleNextRotation() {
  if (!state.autoRotate) return;
  if (state.rotateTimer) clearTimeout(state.rotateTimer);
  if (state.rotateProgressInterval) clearInterval(state.rotateProgressInterval);

  state.rotateProgressStart = Date.now();
  const progressBar = document.getElementById("rotate-progress-bar");

  state.rotateProgressInterval = setInterval(() => {
    if (!state.autoRotate || !progressBar) return;
    const elapsed = Date.now() - state.rotateProgressStart;
    const pct = Math.min((elapsed / ROTATE_INTERVAL_MS) * 100, 100);
    progressBar.style.width = `${pct}%`;
  }, 100);

  state.rotateTimer = setTimeout(() => {
    if (!state.autoRotate) return;
    const list = state.rotationBoards && state.rotationBoards.length ? state.rotationBoards : BOARDS.map(b => b.key);
    const nextIdx = (list.indexOf(state.activeBoard) + 1) % list.length;
    setActiveBoard(list[nextIdx]);
    scheduleNextRotation();
  }, ROTATE_INTERVAL_MS);
}

// ============================================================================
// DATA SOURCE & FETCHING
// ============================================================================

function initDataSource() {
  const savedUrl = localStorage.getItem(STORAGE_KEY_CSV_URL);
  state.currentSheetUrl = savedUrl && savedUrl.trim() ? savedUrl.trim() : GOOGLE_SHEET_CSV_URL;

  const urlInput = document.getElementById("csv-url-input");
  if (urlInput) urlInput.value = state.currentSheetUrl;

  fetchAndSyncMenu(true);

  if (state.autoRotate) startAutoRotate();
}

async function fetchAndSyncMenu(isInitialLoad = false) {
  if (state.isSyncing) return;
  state.isSyncing = true;
  updateStatusIndicator("syncing", "SYNCING");

  const url = state.currentSheetUrl;

  try {
    const cacheBuster = `_cb=${Date.now()}`;
    const fetchUrl = url.includes("?") ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: { "Accept": "text/csv, text/plain, */*" },
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const parsed = parseCSV(csvText);

    if (parsed.items.length > 0) {
      const newSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      const newTicker = parsed.ticker.length ? parsed.ticker : DEFAULT_TICKER.slice();
      // Only re-render when the sheet actually changed, so the 30s poll
      // doesn't reset scrolling columns or flicker the screen.
      const changed = JSON.stringify(parsed.items) !== JSON.stringify(state.currentData)
        || JSON.stringify(newSettings) !== JSON.stringify(state.settings);
      const tickerChanged = JSON.stringify(newTicker) !== JSON.stringify(state.ticker);
      const weatherChanged = ["WeatherLat", "WeatherLon", "WeatherCity"].some(k => newSettings[k] !== state.settings[k]);
      const tvChanged = TV_SETTING_KEYS.some(k => newSettings[k] !== state.settings[k]);

      state.currentData = parsed.items;
      state.settings = newSettings;
      state.ticker = newTicker;
      state.promos = parsed.promos;
      state.lastSyncTimestamp = new Date();
      state.currentBackoffMs = BACKOFF_INITIAL_MS;
      saveMenuCache();
      if (changed) renderActiveBoard();
      if (tickerChanged) renderTicker();
      if (weatherChanged && typeof window.refreshWeather === "function") window.refreshWeather();
      if (tvChanged) applyTvConfig();
      updateStatusIndicator("online", "LIVE");
      updateSyncTimeDisplay();
      updateTechMetrics();
    }
  } catch (err) {
    updateStatusIndicator("offline", "CACHED");
    state.currentBackoffMs = Math.min(state.currentBackoffMs * BACKOFF_MULTIPLIER, BACKOFF_MAX_MS);
    updateTechMetrics(`Sync: ${err.message}`);
  } finally {
    state.isSyncing = false;
  }
}

function startSyncPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(() => {
    fetchAndSyncMenu(false);
  }, POLLING_INTERVAL_MS);
}

// ============================================================================
// CSV PARSER
// ============================================================================

function parseCSV(csvText) {
  const result = { items: [], settings: {}, ticker: [], promos: [] };
  if (!csvText || typeof csvText !== "string") return result;
  const rows = [];
  let currentRow = [];
  let currentToken = "";
  let insideQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : null;

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentToken.trim());
      currentToken = "";
      if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
  }

  if (rows.length < 2) return result;

  const headerKeys = rows[0].map(h => normalizeHeaderKey(h));
  const items = result.items;

  for (let r = 1; r < rows.length; r++) {
    const rowValues = rows[r];
    const rawRecord = {};
    headerKeys.forEach((key, index) => {
      rawRecord[key] = rowValues[index] !== undefined ? rowValues[index] : "";
    });

    const boardVal = (getFieldValue(rawRecord, ["board", "screen", "screentype"]) || "").toLowerCase();
    const nameVal = getFieldValue(rawRecord, ["itemname", "item", "name", "title"]);
    const descVal = getFieldValue(rawRecord, ["description", "desc", "details"]);
    const rawPrice = getFieldValue(rawRecord, ["price", "cost", "amount"]);
    const statusVal = (getFieldValue(rawRecord, ["status", "availability"]) || "").toLowerCase();

    // "Settings" rows: name in ItemName, value in Price (or Description). Kept raw (no $ formatting)
    // so values like weather coordinates or "2 for $5.00" survive unchanged.
    if (boardVal === "settings" || boardVal === "setting") {
      const key = nameVal.replace(/\s+/g, "");
      const value = rawPrice || descVal;
      if (key && value) {
        const match = Object.keys(DEFAULT_SETTINGS).find(k => k.toLowerCase() === key.toLowerCase());
        result.settings[match || key] = value;
      }
      continue;
    }

    // "Ticker" rows: bottom scrolling deals. Status "Hidden" switches a row off.
    if (boardVal === "ticker") {
      if (statusVal !== "hidden" && (nameVal || descVal)) {
        result.ticker.push({ label: nameVal, text: descVal, price: rawPrice });
      }
      continue;
    }

    // "Promo" rows: a finished ad or flyer shown full screen between menu views, as-is (no name/price on top).
    // Category = the board whose TVs show it (or "All"); Photo = the ad image; Status "Hidden" switches it off.
    if (boardVal === "promo") {
      const photo = getFieldValue(rawRecord, ["photo", "image", "picture"]);
      if (statusVal !== "hidden" && photo) {
        result.promos.push({
          ItemName: nameVal || "Promotion",
          Board: getFieldValue(rawRecord, ["category", "cat", "section"]) || "All",
          Photo: photo,
          isPromo: true
        });
      }
      continue;
    }

    const item = {
      Board: getFieldValue(rawRecord, ["board", "screen", "screentype"]) || "Pizza & Wings",
      Category: getFieldValue(rawRecord, ["category", "cat", "section"]) || "Favorites",
      ItemName: getFieldValue(rawRecord, ["itemname", "item", "name", "title"]) || "",
      Description: getFieldValue(rawRecord, ["description", "desc", "details"]) || "",
      Price: formatPrice(getFieldValue(rawRecord, ["price", "cost", "amount"])),
      Status: getFieldValue(rawRecord, ["status", "availability"]) || "Active",
      Badge: getFieldValue(rawRecord, ["badge", "tag", "label"]) || "",
      ComboOption: getFieldValue(rawRecord, ["combooption", "combo", "combodeal"]) || "",
      Spotlight: getFieldValue(rawRecord, ["spotlight", "feature", "featured"]) || "",
      Photo: getFieldValue(rawRecord, ["photo", "image", "picture"]) || ""
    };

    if (item.ItemName.trim()) items.push(item);
  }
  return result;
}

function normalizeHeaderKey(header) {
  return header.replace(/^["']|["']$/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFieldValue(record, candidateKeys) {
  for (const key of candidateKeys) {
    if (record[key] !== undefined && record[key] !== null) {
      const val = String(record[key]).trim();
      if (val.startsWith("#ERROR") || val.startsWith("#REF!") || val.startsWith("#VALUE!") || val.startsWith("#NAME?")) return "";
      return val;
    }
  }
  return "";
}

function formatPrice(val) {
  if (!val) return "";
  const trimmed = val.trim();
  // Only normalize plain amounts like "7.99" or "$7.99". Leave text prices
  // such as "2 for $5.00" untouched (stripping non-digits would turn it into $25.00).
  if (!/^\$?\s*\d+(\.\d+)?$/.test(trimmed)) return trimmed;
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return trimmed;
  return `$${num.toFixed(2)}`;
}

// ============================================================================
// BOARD DISPATCHER & DEDICATED LAYOUT RENDERERS
// ============================================================================

function renderActiveBoard() {
  const container = document.getElementById("menu-board");
  if (!container || state.currentData.length === 0) return;

  updateBoardHeadline(state.activeBoard);

  const normActive = state.activeBoard.toLowerCase();

  // Filter items matching active board
  let boardItems = state.currentData.filter(i => {
    if (isItemHidden(i.Status)) return false;
    const normBoard = (i.Board || "").toLowerCase();
    return normBoard.includes(normActive) || normActive.includes(normBoard);
  });

  if (boardItems.length === 0) boardItems = state.currentData;

  if (normActive.includes("pizza")) {
    renderPizzaBoard(container, boardItems);
  } else if (normActive.includes("platter")) {
    renderPlattersBoard(container, boardItems);
  } else {
    renderSmoothiesBoard(container, boardItems);
  }

  applyPricePulses(boardItems);

  // Initialize auto-scroller for overflowing sections
  initAutoScrolling();
}

// ----------------------------------------------------------------------------
// AMBER PRICE PULSE: glow any price that changed since it was last on screen.
// Tracks the last price *displayed* per item, so a change made while another
// board is showing still glows the first time that board rotates back in.
// ----------------------------------------------------------------------------
const lastShownPrices = new Map();

function applyPricePulses(boardItems) {
  const byName = new Map(boardItems.map(i => [i.ItemName, i]));
  const targets = [];
  document.querySelectorAll("#menu-board .item-card").forEach(card => {
    targets.push([card.dataset.itemName, card.querySelector(".item-price")]);
  });
  document.querySelectorAll("#menu-board .combo-card").forEach(card => {
    targets.push([card.dataset.combo, card.querySelector(".combo-big-price")]);
  });

  targets.forEach(([name, priceEl]) => {
    const item = byName.get(name);
    if (!item || !priceEl) return;
    const key = `${item.Board}|${name}`;
    const previous = lastShownPrices.get(key);
    if (previous !== undefined && previous !== item.Price) {
      priceEl.classList.remove("price-pulse");
      void priceEl.offsetWidth; // restart the animation if it was already running
      priceEl.classList.add("price-pulse");
      priceEl.addEventListener("animationend", () => priceEl.classList.remove("price-pulse"), { once: true });
    }
    lastShownPrices.set(key, item.Price);
  });
}

// ----------------------------------------------------------------------------
// BOARD 1: PIZZA & WINGS (MATCHING PHYSICAL SIGN)
// ----------------------------------------------------------------------------
function renderPizzaBoard(container, items) {
  container.className = "menu-board board-layout-pizza";

  const pizzaItems = sectionItems(items, "pizza");
  const wingItems = sectionItems(items, "wings");
  const cheesyItems = sectionItems(items, "cheesy");
  const comboItems = sectionItems(items, "combos");

  container.innerHTML = `
    <div class="pizza-top-row">
      <!-- Col 1: Cheese Pizza -->
      <section class="menu-column">
        <div class="category-header-wrap with-subbar">
          <div class="brush-banner banner-red"><h2 class="brush-banner-text">CHEESE PIZZA</h2></div>
          <div class="category-subheader-bar">
            <span class="subbar-badge">TOPPINGS ${escapeHTML(setting("ToppingPrice"))} EA:</span>
            <div class="subbar-marquee-viewport">
              <div class="subbar-marquee-track">
                <span class="subbar-item">Pepperoni <span class="subbar-dot">•</span> Sausage <span class="subbar-dot">•</span> Bacon <span class="subbar-dot">•</span> Ham <span class="subbar-dot">•</span> Onions <span class="subbar-dot">•</span> Bell Peppers <span class="subbar-dot">•</span> Extra Mozzarella <span class="subbar-dot">•</span> Jalapeños <span class="subbar-dot">•</span> Black Olives <span class="subbar-dot">•</span> Fresh Mushrooms</span>
                <span class="subbar-dot">•</span>
                <span class="subbar-item">Pepperoni <span class="subbar-dot">•</span> Sausage <span class="subbar-dot">•</span> Bacon <span class="subbar-dot">•</span> Ham <span class="subbar-dot">•</span> Onions <span class="subbar-dot">•</span> Bell Peppers <span class="subbar-dot">•</span> Extra Mozzarella <span class="subbar-dot">•</span> Jalapeños <span class="subbar-dot">•</span> Black Olives <span class="subbar-dot">•</span> Fresh Mushrooms</span>
                <span class="subbar-dot">•</span>
              </div>
            </div>
          </div>
        </div>
        <div class="items-list" id="pizza-col-list"></div>
        <div class="board-feature-image-card" style="height: 100px;">
          <img src="assets/food/pizza_slice_pull.jpg" alt="Hand-Tossed Cheese Pizza Pie" class="board-feature-img">
          <div class="feature-tag">🍕 HAND-TOSSED • BAKED FRESH DAILY</div>
        </div>
      </section>

      <!-- Col 2: Wings & Sauces -->
      <section class="menu-column wings-column">
        <div class="category-header-wrap with-subbar">
          <div class="brush-banner banner-red"><h2 class="brush-banner-text">WINGS</h2></div>
          <div class="category-subheader-bar">
            <span class="subbar-badge">SAUCES:</span>
            <div class="subbar-marquee-viewport">
              <div class="subbar-marquee-track marquee-sauces">
                <span class="subbar-item">Mild Buffalo <span class="subbar-dot">•</span> Hot Buffalo <span class="subbar-dot">•</span> Honey BBQ <span class="subbar-dot">•</span> Garlic Parmesan <span class="subbar-dot">•</span> Lemon Pepper <span class="subbar-dot">•</span> Sweet Teriyaki <span class="subbar-dot">•</span> Mango Habanero</span>
                <span class="subbar-dot">•</span>
                <span class="subbar-item">Mild Buffalo <span class="subbar-dot">•</span> Hot Buffalo <span class="subbar-dot">•</span> Honey BBQ <span class="subbar-dot">•</span> Garlic Parmesan <span class="subbar-dot">•</span> Lemon Pepper <span class="subbar-dot">•</span> Sweet Teriyaki <span class="subbar-dot">•</span> Mango Habanero</span>
                <span class="subbar-dot">•</span>
              </div>
            </div>
          </div>
        </div>
        <div class="items-list" id="wings-col-list"></div>
        <div class="wings-multi-showcase-card">
          <div class="wings-showcase-tile">
            <img src="assets/food/wings_cutout.png" alt="Buffalo Wings" class="wings-showcase-img">
            <span class="wings-sauce-badge">🔥 BUFFALO</span>
          </div>
          <div class="wings-showcase-tile">
            <img src="assets/food/wings_honey_bbq.jpg" alt="Honey BBQ Wings" class="wings-showcase-img">
            <span class="wings-sauce-badge">🍯 HONEY BBQ</span>
          </div>
          <div class="wings-showcase-tile">
            <img src="assets/food/wings_garlic_parm.jpg" alt="Garlic Parm Wings" class="wings-showcase-img">
            <span class="wings-sauce-badge">🧄 GARLIC PARM</span>
          </div>
        </div>
      </section>

      <!-- Col 3: Cheesy Bread & Cutout Photo -->
      <section class="menu-column">
        <div class="category-header-wrap with-subbar">
          <div class="brush-banner banner-red"><h2 class="brush-banner-text">CHEESY BREAD</h2></div>
          <div class="category-subheader-bar">
            <span class="subbar-badge">INCLUDES:</span>
            <div class="subbar-marquee-viewport">
              <div class="subbar-marquee-track marquee-includes">
                <span class="subbar-item">Homemade Warm San Marzano Marinara Dipping Sauce <span class="subbar-dot">•</span> Garlic Herb Butter Glaze <span class="subbar-dot">•</span> Extra Grated Romano</span>
                <span class="subbar-dot">•</span>
                <span class="subbar-item">Homemade Warm San Marzano Marinara Dipping Sauce <span class="subbar-dot">•</span> Garlic Herb Butter Glaze <span class="subbar-dot">•</span> Extra Grated Romano</span>
                <span class="subbar-dot">•</span>
              </div>
            </div>
          </div>
        </div>
        <div class="items-list" id="cheesy-col-list"></div>
        <div class="board-feature-image-card" style="height: 100px;">
          <img src="assets/food/board1_pizza_wings.jpg" alt="Cheese Pizza &amp; Wings" class="board-feature-img">
          <div class="feature-tag">🔥 MADE FRESH TO ORDER</div>
        </div>
      </section>
    </div>

    <!-- Bottom Row: Pizza, Wings & Cheesy Bread Combos with Product Visuals -->
    <section class="pizza-bottom-combos">
      <div class="combos-banner-row">
        <div class="brush-banner banner-red"><h2 class="brush-banner-text">PIZZA, WINGS &amp; CHEESY BREAD COMBOS</h2></div>
      </div>
      <div class="combos-grid" id="combos-col-grid"></div>
    </section>
  `;

  populateList(document.getElementById("pizza-col-list"), pizzaItems);
  populateList(document.getElementById("wings-col-list"), wingItems);
  populateList(document.getElementById("cheesy-col-list"), cheesyItems);

  // Populate Combos with high-impact product imagery and matching badges
  const combosGrid = document.getElementById("combos-col-grid");
  if (combosGrid) {
    const comboConfig = {
      "Combo 1": {
        img: "assets/food/combo1.jpg",
        tags: ["🍕 1 Med Pie", "🍗 6 Wings", "🥤 2L Soda"]
      },
      "Combo 2": {
        img: "assets/food/combo2.jpg",
        tags: ["🍕 1 Large Pie", "🍗 12 Wings", "🥤 2L Soda"]
      },
      "Combo 3": {
        img: "assets/food/combo3.jpg",
        tags: ["🍕🍕 2 Med (1-Top Each)", "🍗 8 Wings", "🥤 2L Soda"]
      },
      "Combo 4": {
        img: "assets/food/combo4.jpg",
        tags: ["🧀 8 Cheesy Bread", "🍗 6 Wings", "🥫 Can Soda"]
      }
    };

    comboItems.forEach(item => {
      const builtIn = comboConfig[item.ItemName];
      const cfg = {
        img: photoUrl(item.Photo) || (builtIn ? builtIn.img : "assets/food/combo1.jpg"),
        tags: builtIn ? builtIn.tags : String(item.Description || "").split("+").map(t => t.trim()).filter(Boolean).slice(0, 4)
      };

      const tagsHtml = cfg.tags.map(t => `<span class="combo-visual-tag">${escapeHTML(t)}</span>`).join("");

      const card = document.createElement("div");
      card.className = "combo-card";
      card.dataset.combo = item.ItemName;
      card.innerHTML = `
        <div class="combo-header-row">
          <span class="combo-badge-tag">${escapeHTML(item.ItemName)}</span>
          <span class="combo-big-price">${escapeHTML(item.Price)}</span>
        </div>
        <div class="combo-visual-box">
          <img src="${escapeHTML(cfg.img)}" alt="${escapeHTML(item.ItemName)}" class="combo-visual-img">
          <div class="combo-tag-overlay">${tagsHtml}</div>
        </div>
        <div class="combo-desc-text">${escapeHTML(item.Description)}</div>
      `;
      combosGrid.appendChild(card);
    });
  }
}

// ----------------------------------------------------------------------------
// BOARD 2: PLATTERS & FAVORITES (MATCHING PHYSICAL SIGN WITH RICH PHOTOGRAPHY)
// ----------------------------------------------------------------------------
// The drink choices shown big in the Add a Drink box come from the "Add a Drink" deal in the
// ticker (e.g. "Ice Cold Coca-Cola, Sprite, or Fanta for only"), so they follow the sheet.
function drinkChoicesText() {
  const deal = (state.ticker || []).find(t => /drink/i.test(t.label || ""));
  const text = deal && String(deal.text || "").replace(/\s*(for\s+)?only\s*$/i, "").trim();
  return text || "Ice Cold 2L or Can Soda";
}

function renderPlattersBoard(container, items) {
  container.className = "menu-board board-layout-platters";

  const platters = sectionItems(items, "platters");
  const dominican = sectionItems(items, "dominican");
  const burgers = sectionItems(items, "burgers");
  const sandwiches = sectionItems(items, "sandwiches");
  const tacos = sectionItems(items, "tacos");

  // Photo caption follows the Deluxe Burger's live price from the sheet.
  const deluxe = items.find(i => (i.ItemName || "").toLowerCase().includes("deluxe burger"));
  const burgerCaption = deluxe && deluxe.Price ? `DELUXE CHEESEBURGER • ${deluxe.Price}` : "DELUXE CHEESEBURGER";

  container.innerHTML = `
    <!-- Col 1: Platters & Burgers -->
    <div class="platters-col">
      <section class="menu-column" style="flex: 1;">
        <div class="category-header-wrap header-with-food-badge">
          <div class="header-title-group">
            <img src="assets/icons/icon_platter.png" alt="Platters" class="header-food-badge">
            <div class="brush-banner banner-red"><h2 class="brush-banner-text">PLATTERS</h2></div>
          </div>
          <span class="sub-note">Includes: Rice, Beans, Salad &amp; Plantains</span>
        </div>
        <div class="items-list" id="platters-list"></div>
        <!-- No platter photo yet: shows the fried plantains (a side with every platter). Swap in a real platter photo when there is one. -->
        <div class="board-feature-image-card platters-feature" style="height: 110px;">
          <img src="assets/food/dominican_mofongo.jpg" alt="Sweet fried plantains" class="board-feature-img">
          <div class="feature-tag">🍽️ RICE • BEANS • SALAD • PLANTAINS</div>
        </div>
      </section>

      <section class="menu-column" style="flex: 1;">
        <div class="category-header-wrap header-with-food-badge">
          <div class="header-title-group">
            <img src="assets/icons/icon_burger.png" alt="Burgers" class="header-food-badge">
            <div class="brush-banner banner-yellow"><h2 class="brush-banner-text">BURGERS</h2></div>
          </div>
        </div>
        <div class="items-list" id="burgers-list"></div>
        <div class="board-feature-image-card" style="height: 110px;">
          <img src="assets/food/deluxe_burger_pure.jpg" alt="Deluxe Double Cheeseburger" class="board-feature-img">
          <div class="feature-tag">🍔 ${escapeHTML(burgerCaption)}</div>
        </div>
      </section>
    </div>

    <!-- Col 2: Dominican Favorites & Tacos/Quesadillas -->
    <div class="platters-col">
      <section class="menu-column" style="flex: 1;">
        <div class="category-header-wrap header-with-food-badge">
          <div class="header-title-group">
            <img src="assets/icons/icon_mofongo.png" alt="Dominican Favorites" class="header-food-badge">
            <div class="brush-banner banner-yellow"><h2 class="brush-banner-text">DOMINICAN FAVORITES</h2></div>
          </div>
        </div>
        <div class="items-list" id="dominican-list"></div>
        <div class="board-feature-image-card" style="height: 110px;">
          <img src="assets/food/dominican_mofongo.jpg" alt="Dominican Mofongo &amp; Pernil" class="board-feature-img">
          <div class="feature-tag">🔥 AUTHENTIC MOFONGO &amp; PERNIL</div>
        </div>
      </section>

      <section class="menu-column" style="flex: 1;">
        <div class="category-header-wrap header-with-food-badge">
          <div class="header-title-group">
            <img src="assets/icons/icon_taco.png" alt="Tacos &amp; Quesadillas" class="header-food-badge">
            <div class="brush-banner banner-green"><h2 class="brush-banner-text">TACOS &amp; QUESADILLAS</h2></div>
          </div>
        </div>
        <div class="items-list" id="tacos-list"></div>
        <div class="board-feature-image-card" style="height: 110px;">
          <img src="assets/food/tacos_quesadillas.jpg" alt="Authentic Street Tacos &amp; Quesadillas" class="board-feature-img">
          <div class="feature-tag">🌮 STREET TACOS &amp; QUESADILLAS</div>
        </div>
      </section>
    </div>

    <!-- Col 3: Sandwiches/Wraps, Chef's Picks & Add a Drink -->
    <div class="platters-col">
      <section class="menu-column" style="flex: 1.1;">
        <div class="category-header-wrap header-with-food-badge">
          <div class="header-title-group">
            <img src="assets/icons/icon_sandwich.png" alt="Sandwiches &amp; Wraps" class="header-food-badge">
            <div class="brush-banner banner-red"><h2 class="brush-banner-text">SANDWICHES / WRAPS</h2></div>
          </div>
        </div>
        <div class="items-list" id="sandwiches-list"></div>
      </section>

      <!-- Chef's Picks Showcase Photos above Add A Drink -->
      <div class="board-feature-image-card" style="height: 100px;">
        <img src="assets/food/cuban_sandwich.jpg" alt="Chef's Pick Authentic Cuban Sandwich" class="board-feature-img">
        <div class="feature-tag">⭐ CHEF'S PICK • AUTHENTIC CUBAN SANDWICH</div>
      </div>

      <!-- Add A Drink Callout with Meal Deal & Food Photos -->
      <div class="add-drink-callout-card" style="flex: 1.15;">
        <div class="add-drink-title">
          <div class="brush-banner banner-yellow"><h3 class="brush-banner-text" style="font-size: 1.25rem;">ADD A DRINK</h3></div>
          <span class="drink-price">${escapeHTML(setting("DrinkPrice"))}</span>
        </div>
        <div class="drink-sub" style="font-size: 0.85rem; font-weight: 800; color: #FACC15; margin: 0.15rem 0;">PAIR WITH ANY MEAL</div>
        <div class="drink-choices">${escapeHTML(drinkChoicesText())}</div>

        <!-- 4 Visual Showcase Cards: Deal Offered + Food Selections -->
        <div class="drink-food-visuals-grid">
          <div class="drink-visual-card">
            <img src="assets/food/combo1.jpg" alt="Meal &amp; 2L Soda Deal" class="drink-visual-img">
            <div class="drink-visual-tag">MEAL + 2L DEAL</div>
          </div>
          <div class="drink-visual-card">
            <img src="assets/food/sodas_ice_cold.jpg" alt="Ice Cold 2L &amp; Cans" class="drink-visual-img">
            <div class="drink-visual-tag">ICE COLD SODA</div>
          </div>
          <div class="drink-visual-card">
            <img src="assets/food/deluxe_burger_pure.jpg" alt="Deluxe Burger" class="drink-visual-img">
            <div class="drink-visual-tag">DELUXE BURGER</div>
          </div>
          <div class="drink-visual-card">
            <img src="assets/food/tacos_quesadillas.jpg" alt="Street Tacos &amp; Quesadillas" class="drink-visual-img">
            <div class="drink-visual-tag">STREET TACOS</div>
          </div>
        </div>

        <div class="drink-desc" style="font-size: 0.70rem; color: #E2E8F0; font-weight: 700; line-height: 1.2;">
          Pair with any Platter, Burger, Tacos, or Sandwich • Ice Cold 2L or Can Soda
        </div>
      </div>
    </div>
  `;

  populateList(document.getElementById("platters-list"), platters);
  populateList(document.getElementById("burgers-list"), burgers);
  populateList(document.getElementById("dominican-list"), dominican);
  populateList(document.getElementById("tacos-list"), tacos);
  populateList(document.getElementById("sandwiches-list"), sandwiches);
}

// ----------------------------------------------------------------------------
// BOARD 3: SMOOTHIES & HEALTHY (WITH SMOOTH AUTO-MARQUEE FOR ALL 11 SHAKES)
// ----------------------------------------------------------------------------
function renderSmoothiesBoard(container, items) {
  container.className = "menu-board board-layout-smoothies";

  const fruitSmoothies = sectionItems(items, "fruit");
  const proteinShakes = sectionItems(items, "protein");
  const salads = sectionItems(items, "salads");

  const proteinCol1 = proteinShakes.slice(0, 6);
  const proteinCol2 = proteinShakes.slice(6);

  container.innerHTML = `
    <!-- Col 1: Smoothies -->
    <section class="menu-column">
      <div class="category-header-wrap with-subbar">
        <div class="brush-banner banner-red"><h2 class="brush-banner-text">SMOOTHIES</h2></div>
        <div class="category-subheader-bar smoothie-sizes-bar">
          <span class="subbar-badge">SIZES:</span>
          <span class="size-pill-item">S 16oz <strong>${escapeHTML(setting("SmoothieSmall"))}</strong></span>
          <span class="subbar-dot">•</span>
          <span class="size-pill-item">M 20oz <strong>${escapeHTML(setting("SmoothieMedium"))}</strong></span>
          <span class="subbar-dot">•</span>
          <span class="size-pill-item">L 24oz <strong>${escapeHTML(setting("SmoothieLarge"))}</strong></span>
        </div>
      </div>
      <div class="items-list" id="fruit-list"></div>
      <div class="board-feature-image-card" style="height: 185px;">
        <img src="assets/food/smoothies_5_cups_flat_lids.jpg" alt="5 Signature Smoothies with Flat Lids &amp; Logos" class="board-feature-img" style="object-fit: cover; object-position: center 68%;">
        <div class="feature-tag">🥤 5 SIGNATURE REAL FRUIT SMOOTHIES</div>
      </div>
    </section>

    <!-- Col 2: Protein Smoothies Part 1 -->
    <section class="menu-column">
      <div class="category-header-wrap with-subbar">
        <div class="brush-banner banner-yellow"><h2 class="brush-banner-text">PROTEIN SMOOTHIES</h2></div>
        <div class="category-subheader-bar smoothie-sizes-bar">
          <span class="subbar-badge">SIZES:</span>
          <span class="size-pill-item">S 16oz <strong>${escapeHTML(setting("ProteinSmall"))}</strong></span>
          <span class="subbar-dot">•</span>
          <span class="size-pill-item">M 20oz <strong>${escapeHTML(setting("ProteinMedium"))}</strong></span>
          <span class="subbar-dot">•</span>
          <span class="size-pill-item">L 24oz <strong>${escapeHTML(setting("ProteinLarge"))}</strong></span>
        </div>
      </div>
      <div class="items-list" id="protein-list-1"></div>
    </section>

    <!-- Col 3: Protein Smoothies Part 2 & Protein Boost -->
    <section class="menu-column">
      <div class="category-header-wrap">
        <div class="brush-banner banner-yellow"><h2 class="brush-banner-text">FITNESS &amp; POWER</h2></div>
        <span class="category-items-count">${proteinCol2.length} BLEND${proteinCol2.length === 1 ? "" : "S"}</span>
      </div>
      <div class="items-list" id="protein-list-2"></div>
      <div class="fitness-boost-card">
        <div class="boost-card-header">
          <span class="badge-yellow">⚡ POWER UP YOUR BLEND</span>
        </div>
        <div class="boost-card-body">
          <div class="boost-row">
            <span class="boost-label">Add Extra Whey Protein (25g)</span>
            <span class="boost-price">${escapeHTML(setting("ExtraProteinPrice"))}</span>
          </div>
          <div class="boost-row">
            <span class="boost-label">Chia Seeds, Flax &amp; Oats</span>
            <span class="boost-price">${escapeHTML(setting("SeedsOatsPrice"))}</span>
          </div>
          <div class="boost-sub">Almond Milk • Oat Milk • Whole Milk • Orange Juice</div>
        </div>
      </div>
    </section>

    <!-- Col 4: Salads & Empanadas -->
    <div class="smoothies-col-split">
      <section class="menu-column" style="flex: 1.4;">
        <div class="category-header-wrap">
          <div class="brush-banner banner-red"><h2 class="brush-banner-text">SALADS</h2></div>
        </div>
        <div class="items-list" id="salads-list"></div>
      </section>

      <section class="menu-column col-empanadas-sub" style="flex: 0.6;">
        <div class="empanadas-callout-header">
          <div class="brush-banner banner-green"><h2 class="brush-banner-text" style="font-size: 1.05rem;">EMPANADAS</h2></div>
          <span class="empanada-big-price">${escapeHTML(setting("EmpanadaPrice"))}</span>
        </div>
        <div class="empanada-flavors">
          ${setting("EmpanadaFlavors").split(",").map(f => f.trim()).filter(Boolean).map(f => `<span>• ${escapeHTML(f)}</span>`).join(" ")}
        </div>
        <div class="board-feature-image-card" style="height: 60px; margin-top: 0.2rem;">
          <img src="assets/food/empanadas_crispy.jpg" alt="Hot Crispy Stuffed Empanadas" class="board-feature-img">
          <div class="feature-tag">🥟 FRESH &amp; CRISPY</div>
        </div>
      </section>
    </div>
  `;

  populateList(document.getElementById("fruit-list"), fruitSmoothies);
  populateList(document.getElementById("protein-list-1"), proteinCol1);
  populateList(document.getElementById("protein-list-2"), proteinCol2);
  populateList(document.getElementById("salads-list"), salads);
}

// ----------------------------------------------------------------------------
// PRODUCT SPOTLIGHT: after the menu has shown for SpotlightMenuSeconds, show the next
// SpotlightPerBreak featured items (Spotlight = Yes, with a Photo) full screen for SpotlightPhotoSeconds each,
// then go back to the menu. Sold out / hidden items are skipped.
// ----------------------------------------------------------------------------
const spotlight = { timer: null, running: false };

function spotlightSeconds(key) {
  const def = window.MENU_SCHEMA.settings.find(s => s.key === key);
  const n = parseInt(setting(key), 10);
  return Math.min(Math.max(isNaN(n) ? parseInt(def.default, 10) : n, def.min), def.max);
}

function isSpotlightOn(value) {
  return /^(yes|y|true|1|on|x)$/i.test(String(value || "").trim());
}

function spotlightItems() {
  const boards = (state.tv ? (state.rotationBoards || []) : state.autoRotate ? BOARDS.map(b => b.key) : [state.activeBoard])
    .map(b => b.toLowerCase());
  const items = state.currentData.filter(i =>
    boards.includes(String(i.Board || "").trim().toLowerCase()) &&
    isSpotlightOn(i.Spotlight) && photoUrl(i.Photo) &&
    !isItemHidden(i.Status) && !isItemSoldOut(i.Status)
  ).slice(0, 8);
  // Promos (finished ads) play after the product photos; "All" shows on every TV.
  const promos = (state.promos || []).filter(p => {
    const target = String(p.Board || "").trim().toLowerCase();
    return photoUrl(p.Photo) && (target === "all" || boards.includes(target));
  }).slice(0, 3);
  return items.concat(promos);
}

function startSpotlightCycle() {
  clearTimeout(spotlight.timer);
  if (spotlight.running) return; // the current run schedules the next one when it ends
  // ?spotlight=now starts the first run right away (for previewing on a TV)
  const now = !spotlight.started && new URLSearchParams(location.search).get("spotlight") === "now";
  spotlight.started = true;
  spotlight.timer = setTimeout(runSpotlight, now ? 1500 : spotlightSeconds("SpotlightMenuSeconds") * 1000);
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    const timeout = setTimeout(() => resolve(false), 10000);
    img.onload = () => { clearTimeout(timeout); resolve(true); };
    img.onerror = () => { clearTimeout(timeout); resolve(false); };
    img.src = src;
  });
}

// Each break shows only SpotlightPerBreak items (default 2), taking turns through the list,
// so every spotlight comes round in a continuous loop with long menu stretches in between.
function nextSpotlightBatch() {
  const all = spotlightItems();
  const per = spotlightSeconds("SpotlightPerBreak");
  if (all.length <= per) return all;
  const start = (spotlight.cursor || 0) % all.length;
  spotlight.cursor = start + per;
  return Array.from({ length: per }, (_, i) => all[(start + i) % all.length]);
}

async function runSpotlight() {
  const items = nextSpotlightBatch();
  const el = document.getElementById("spotlight");
  if (!items.length || !el) return startSpotlightCycle();
  spotlight.running = true;
  const seconds = spotlightSeconds("SpotlightPhotoSeconds");
  const bar = document.getElementById("spotlight-progress-bar");

  for (const item of items) {
    const src = photoUrl(item.Photo);
    if (!(await preloadImage(src))) continue; // photo missing or offline: skip it
    if (el.classList.contains("is-visible")) { el.classList.add("is-swapping"); await pause(400); }

    const img = document.getElementById("spotlight-img");
    img.src = src;
    img.alt = item.ItemName;
    el.classList.toggle("is-promo", !!item.isPromo);
    if (!item.isPromo) {
      const hit = window.MENU_SCHEMA_sectionOf(item);
      document.getElementById("spotlight-section").textContent = hit ? hit.section.label : item.Category;
      document.getElementById("spotlight-name").textContent = item.ItemName;
      document.getElementById("spotlight-desc").textContent = item.Description;
      document.getElementById("spotlight-price").textContent = item.Price;
      document.getElementById("spotlight-badge").textContent = item.Badge;
    }

    bar.style.transition = "none";
    bar.style.width = "0%";
    void bar.offsetWidth;
    bar.style.transition = `width ${seconds}s linear`;
    bar.style.width = "100%";

    el.classList.remove("is-swapping");
    el.classList.add("is-visible");
    el.setAttribute("aria-hidden", "false");
    await pause(seconds * 1000);
  }

  el.classList.remove("is-visible");
  el.setAttribute("aria-hidden", "true");
  spotlight.running = false;
  startSpotlightCycle();
}

// ----------------------------------------------------------------------------
// AUTO-SCROLL FOR LONG SECTIONS: lists that don't fit scroll down and back up, all in sync.
// This is by design (owner's choice, 2026-11-23): big readable text first, scrolling to show the rest.
// ----------------------------------------------------------------------------
let activeAutoScrollInterval = null;
let autoScrollTrackers = [];

// NO EMPTY SPACE: each section grows its own text (the --fit multiplier, see the TV legibility
// block in css/styles.css) until its box is full. A section that doesn't fit even at the base
// size keeps the base size and scrolls instead. Text is never cut or shortened.
const FIT_MIN = 1, FIT_MAX = 1.35, FIT_SNUG = 0.95;
// Web fonts change text widths when they arrive, so fit again once they have loaded.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (autoScrollTrackers.length) initAutoScrolling(); });
function fitSections(lists) {
  lists.forEach(list => {
    if (list.clientHeight < 40) return;   // hidden or mid-transition: can't measure, try again later
    // Set the size directly on the list (inherited custom properties don't always refresh the
    // rows in Chromium-based TV browsers, which made the fit measure the wrong size).
    const apply = f => { list.style.setProperty("font-size", (16 * f).toFixed(2) + "px", "important"); list.dataset.fit = f.toFixed(3); };
    const fits = f => { apply(f); return list.scrollHeight <= list.clientHeight; };
    if (!fits(FIT_MIN)) {
      // Only a hair too long: shrink a little (to 95%) rather than scroll a few pixels.
      if (fits(FIT_SNUG)) {
        let lo = FIT_SNUG, hi = FIT_MIN;
        for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
        return apply(lo);
      }
      return apply(FIT_MIN);              // too long: base size + scrolling
    }
    if (fits(FIT_MAX)) return;            // lots of room: biggest allowed size
    let lo = FIT_MIN, hi = FIT_MAX;
    for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    apply(lo);
  });
}

function initAutoScrolling() {
  if (activeAutoScrollInterval) {
    clearInterval(activeAutoScrollInterval);
    activeAutoScrollInterval = null;
  }
  autoScrollTrackers = [];

  // Allow DOM layout pass to measure exact heights
  setTimeout(() => {
    const listContainers = document.querySelectorAll(".items-list");
    fitSections(listContainers);
    // The layout keeps settling for a moment (photos, fonts, the board's entrance), so fit again
    // whenever a section's box changes size, and at the start of every scroll cycle (below).
    if (window.ResizeObserver) {
      if (window.__fitObserver) window.__fitObserver.disconnect();
      let pending = null;
      window.__fitObserver = new ResizeObserver(() => {
        clearTimeout(pending);
        pending = setTimeout(() => fitSections(document.querySelectorAll(".items-list")), 200);
      });
      listContainers.forEach(l => window.__fitObserver.observe(l));
    }
    [1500, 4000].forEach(ms => setTimeout(() => fitSections(document.querySelectorAll(".items-list")), ms));
    listContainers.forEach(container => {
      container.scrollTop = 0;
      const overflow = container.scrollHeight - container.clientHeight;
      container.classList.toggle("has-overflow-scroll", overflow > 1);
      // Every list joins the shared clock; one that fits just has nothing to scroll.
      autoScrollTrackers.push({ el: container, maxScroll: Math.max(0, overflow) });
    });

    if (autoScrollTrackers.length > 0) {
      // SYNCHRONIZED: one shared clock for every section on the board. All lists pause at the
      // top together, scroll down together, pause at the bottom together and come back up
      // together. Each list covers its own overflow in the same time, so a longer list moves a
      // little faster. The travel time comes from the longest list at a comfortable reading speed.
      const PAUSE_MS = 4000;          // hold at the top and at the bottom
      const SPEED_PX_PER_S = 28;      // speed of the longest list (in 1920x1080 board pixels)
      const start = performance.now();
      activeAutoScrollInterval = setInterval(() => {
        let longest = 0;
        autoScrollTrackers.forEach(t => {
          t.maxScroll = Math.max(0, t.el.scrollHeight - t.el.clientHeight);
          longest = Math.max(longest, t.maxScroll);
        });
        if (longest <= 1) return;
        const travel = Math.max(3000, (longest / SPEED_PX_PER_S) * 1000);
        const cycle = 2 * PAUSE_MS + 2 * travel;
        const elapsed = performance.now() - start;
        const cycleNo = Math.floor(elapsed / cycle);
        if (cycleNo !== autoScrollTrackers.cycleNo) { // back at the top: re-check the text sizes
          autoScrollTrackers.cycleNo = cycleNo;
          if (cycleNo > 0) fitSections(autoScrollTrackers.map(tr => tr.el));
        }
        const t = elapsed % cycle;
        let p; // 0 = top, 1 = bottom
        if (t < PAUSE_MS) p = 0;
        else if (t < PAUSE_MS + travel) p = (t - PAUSE_MS) / travel;
        else if (t < 2 * PAUSE_MS + travel) p = 1;
        else p = 1 - (t - 2 * PAUSE_MS - travel) / travel;
        const eased = p * p * (3 - 2 * p); // ease in and out, no jerk at the ends
        autoScrollTrackers.forEach(tr => { tr.el.scrollTop = eased * tr.maxScroll; });
      }, 33);
    }
  }, 300);
}

function populateList(containerEl, items) {
  if (!containerEl) return;
  containerEl.innerHTML = "";
  items.forEach(item => {
    const card = createItemCardElement(item);
    containerEl.appendChild(card);
  });
}

function createItemCardElement(item) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.dataset.itemName = item.ItemName;
  card.dataset.price = item.Price;

  const isSoldOut = isItemSoldOut(item.Status);
  if (isSoldOut) card.classList.add("is-sold-out");

  const titleRow = document.createElement("div");
  titleRow.className = "item-title-row";

  const nameEl = document.createElement("h3");
  nameEl.className = "item-name";
  nameEl.textContent = item.ItemName;
  titleRow.appendChild(nameEl);

  const badgeSlot = document.createElement("span");
  badgeSlot.className = "item-badge-slot";
  renderBadgeSlot(badgeSlot, item.Badge, isSoldOut);
  titleRow.appendChild(badgeSlot);

  const leader = document.createElement("div");
  leader.className = "item-leader";
  leader.setAttribute("aria-hidden", "true");
  titleRow.appendChild(leader);

  const priceWrapper = document.createElement("div");
  priceWrapper.className = "item-price-wrapper";
  const priceEl = document.createElement("span");
  priceEl.className = "item-price";
  priceEl.textContent = item.Price;
  priceWrapper.appendChild(priceEl);
  titleRow.appendChild(priceWrapper);

  card.appendChild(titleRow);

  if (item.Description) {
    const descEl = document.createElement("p");
    descEl.className = "item-desc";
    descEl.textContent = item.Description;
    card.appendChild(descEl);
  }

  return card;
}

function isItemHidden(status) {
  return String(status || "").trim().toLowerCase() === "hidden";
}

// Items for one section, using the shared rules in js/menu-schema.js.
function sectionItems(items, sectionId) {
  return items.filter(i => {
    const hit = window.MENU_SCHEMA_sectionOf(i);
    return hit && hit.section.id === sectionId;
  });
}

// Photo column: a library file (assets/...) or a web address (uploaded photos). Anything else is ignored.
function photoUrl(value) {
  const v = String(value || "").trim();
  if (/^https:\/\/[^\s"'<>]+$/i.test(v) || /^assets\/[\w\-\/.]+\.(jpe?g|png|webp)$/i.test(v)) return v;
  return "";
}

function isItemSoldOut(status) {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "sold out" || s === "soldout" || s === "out of stock" || s === "unavailable";
}

function renderBadgeSlot(container, badgeText, isSoldOut) {
  container.innerHTML = "";
  if (isSoldOut) {
    const badge = document.createElement("span");
    badge.className = "item-badge badge-soldout";
    badge.textContent = "SOLD OUT";
    container.appendChild(badge);
    return;
  }
  if (!badgeText || !badgeText.trim()) return;

  const text = badgeText.trim();
  const lower = text.toLowerCase();
  const badge = document.createElement("span");
  badge.className = "item-badge";

  if (lower.includes("popular")) badge.classList.add("badge-popular");
  else if (lower.includes("special") || lower.includes("chef") || lower.includes("favorite")) badge.classList.add("badge-chefs-special");
  else if (lower.includes("new") || lower.includes("superfood") || lower.includes("healthy")) badge.classList.add("badge-new");
  else badge.classList.add("badge-popular");

  badge.textContent = text;
  container.appendChild(badge);
}

// ============================================================================
// TV HARDWARE & KIOSK SAFEGUARDS
// ============================================================================

function applyBurnInShift() {
  const container = document.getElementById("screen-container");
  if (!container) return;
  state.burnInShiftIndex = (state.burnInShiftIndex + 1) % BURN_IN_OFFSETS.length;
  const offset = BURN_IN_OFFSETS[state.burnInShiftIndex];
  container.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
  const metricEl = document.getElementById("metric-burnin-offset");
  if (metricEl) metricEl.textContent = `X: ${offset.x}px, Y: ${offset.y}px`;
}

function initAntiBurnIn() {
  setInterval(applyBurnInShift, BURN_IN_INTERVAL_MS);
}

function initKioskSafeguards() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  // The browser drops the wake lock whenever the page is hidden, so ask again
  // every time it becomes visible.
  requestWakeLock();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestWakeLock();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && (e.key === "m" || e.key === "M")) || e.key === "`" || e.key === "~") {
      e.preventDefault();
      toggleTechPanel();
    }
  });
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  if (state.wakeLock && !state.wakeLock.released) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
  } catch (e) {
    // Not allowed right now (e.g. page not visible); the next visibility change retries.
  }
}

// Reload once a night to clear memory from 24/7 running and pick up published updates.
// Only reloads when the page can actually be reached, so a network outage never
// replaces the menu with a browser error page.
function scheduleNightlyReload() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(NIGHTLY_RELOAD_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(tryNightlyReload, next - now);
}

async function tryNightlyReload() {
  if (location.protocol === "file:") { location.reload(); return; }
  try {
    const res = await fetch(location.pathname + "?_reloadcheck=" + Date.now(), { method: "HEAD", cache: "no-store" });
    if (res.ok) { location.reload(); return; }
  } catch (e) {}
  setTimeout(tryNightlyReload, RELOAD_RETRY_MS);
}

function initLiveClock() {
  const digitsEl = document.getElementById("clock-digits");
  const ampmEl = document.getElementById("clock-ampm");
  const dayEl = document.getElementById("clock-day");
  const monthDayEl = document.getElementById("clock-month-day");

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    if (digitsEl) digitsEl.textContent = `${hours}:${minutes}`;
    if (ampmEl) ampmEl.textContent = ampm;

    if (dayEl) {
      dayEl.textContent = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    }
    if (monthDayEl) {
      monthDayEl.textContent = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
}

function initLiveWeather() {
  const iconEl = document.getElementById("weather-icon");
  const tempEl = document.getElementById("weather-temp");
  const condEl = document.getElementById("weather-condition");
  const cityEl = document.getElementById("weather-city");
  const widgetEl = document.querySelector(".weather-widget-centered");

  async function fetchWeather() {
    if (cityEl) cityEl.textContent = String(setting("WeatherCity")).toUpperCase();
    const lat = parseFloat(setting("WeatherLat"));
    const lon = parseFloat(setting("WeatherLon"));
    try {
      if (isNaN(lat) || isNaN(lon)) throw new Error("Invalid weather location");
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`, { cache: "no-store" });
      if (!res.ok) throw new Error("Weather offline");
      const data = await res.json();
      if (data && data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        let icon = "☀️";
        let cond = "SUNNY";
        if (code === 0) { icon = "☀️"; cond = "SUNNY"; }
        else if (code >= 1 && code <= 3) { icon = "⛅"; cond = "PARTLY CLOUDY"; }
        else if (code >= 45 && code <= 48) { icon = "🌫️"; cond = "FOGGY"; }
        else if (code >= 51 && code <= 67) { icon = "🌧️"; cond = "RAINY"; }
        else if (code >= 71 && code <= 77) { icon = "❄️"; cond = "SNOWY"; }
        else if (code >= 80 && code <= 99) { icon = "⛈️"; cond = "STORMY"; }

        if (tempEl) tempEl.textContent = `${temp}°F`;
        if (iconEl) iconEl.textContent = icon;
        if (condEl) condEl.textContent = cond;
        if (widgetEl) widgetEl.style.visibility = "visible";
      }
    } catch (e) {
      // No live weather: hide the box (keeps its space) rather than show made-up weather.
      if (widgetEl) widgetEl.style.visibility = "hidden";
    }
  }

  window.refreshWeather = fetchWeather;
  if (widgetEl) widgetEl.style.visibility = "hidden"; // shown once real weather arrives
  fetchWeather();
  setInterval(fetchWeather, 15 * 60 * 1000); // Check every 15 min
}

function updateStatusIndicator(mode, labelText) {
  const container = document.getElementById("connection-status");
  if (!container) return;
  container.className = `status-indicator-mini ${mode}`;
}

// ----------------------------------------------------------------------------
// BOTTOM TICKER: fixed store notices + deals (deals editable from the sheet)
// ----------------------------------------------------------------------------
const PHONE_SVG = `<svg class="inline-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>`;
const INSTA_SVG = `<svg class="inline-svg-icon insta-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
const TICKER_FIXED_ITEMS = [
  `<span class="ticker-item"><span class="highlight-allergy">⚠️ ALLERGY ADVISORY:</span> Food prepared here may contain milk, eggs, wheat, peanuts, tree nuts, fish &amp; shellfish. Please notify staff of any food allergies.</span>`,
  `<span class="ticker-item"><span class="highlight-tax">📋 SALES TAX:</span> Prices do not include applicable sales tax.</span>`,
  `<span class="ticker-item"><span class="highlight-contact">${PHONE_SVG} CALL TO ORDER:</span> <strong style="color: #FACC15; font-family: var(--font-mono); font-size: 1em;">347-202-7432</strong></span>`,
  `<span class="ticker-item"><span class="highlight-insta">${INSTA_SVG} INSTAGRAM:</span> <strong style="color: #FACC15; font-size: 1em;">@snackstation718</strong></span>`
];

function renderTicker() {
  const el = document.getElementById("ticker-content");
  if (!el) return;
  const deals = (state.ticker || []).map(t => {
    const label = t.label ? `<span class="highlight">${escapeHTML(t.label.replace(/:$/, ""))}:</span> ` : "";
    const price = t.price ? ` <span class="highlight-price">${escapeHTML(t.price)}</span>` : "";
    return `<span class="ticker-item">${label}${escapeHTML(t.text || "")}${price}</span>`;
  });
  const sep = `<span class="ticker-separator">•</span>`;
  const loop = TICKER_FIXED_ITEMS.concat(deals).join(sep) + sep;
  // Two identical copies so the -50% scroll animation loops seamlessly.
  el.innerHTML = loop + loop;
}

function updateSyncTimeDisplay() {
  const syncEl = document.getElementById("last-sync-time");
  if (!syncEl) return;
  const now = new Date();
  syncEl.textContent = `Synced: ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
}

function initTechPanel() {
  const panel = document.getElementById("tech-panel");
  const toggleBtn = document.getElementById("dev-panel-toggle");
  const closeBtn = document.getElementById("tech-panel-close");
  const saveUrlBtn = document.getElementById("btn-save-url");
  const resetMockBtn = document.getElementById("btn-reset-mock");
  const simPriceBtn = document.getElementById("btn-sim-price-change");
  const simSoldoutBtn = document.getElementById("btn-sim-toggle-soldout");
  const toggleCursorBtn = document.getElementById("btn-toggle-cursor");

  if (toggleBtn) toggleBtn.addEventListener("click", () => toggleTechPanel());
  if (closeBtn) closeBtn.addEventListener("click", () => toggleTechPanel(false));

  if (saveUrlBtn) {
    saveUrlBtn.addEventListener("click", () => {
      const input = document.getElementById("csv-url-input");
      const url = input ? input.value.trim() : "";
      if (url) {
        localStorage.setItem(STORAGE_KEY_CSV_URL, url);
        state.currentSheetUrl = url;
      }
      fetchAndSyncMenu(false);
    });
  }

  if (resetMockBtn) {
    resetMockBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY_CSV_URL);
      state.currentSheetUrl = GOOGLE_SHEET_CSV_URL;
      state.currentData = JSON.parse(JSON.stringify(AUTHENTIC_MENU_DATA));
      state.settings = { ...DEFAULT_SETTINGS };
      state.ticker = DEFAULT_TICKER.slice();
      state.promos = [];
      renderActiveBoard();
      renderTicker();
    });
  }

  if (simPriceBtn) {
    simPriceBtn.addEventListener("click", () => {
      if (state.currentData.length > 0) {
        const item = state.currentData[0];
        const num = parseFloat(item.Price.replace(/[^0-9.]/g, "")) || 7.99;
        item.Price = `$${(num + 0.50).toFixed(2)}`;
        renderActiveBoard();
      }
    });
  }

  if (simSoldoutBtn) {
    simSoldoutBtn.addEventListener("click", () => {
      if (state.currentData.length > 0) {
        const item = state.currentData[0];
        item.Status = isItemSoldOut(item.Status) ? "Active" : "Sold Out";
        renderActiveBoard();
      }
    });
  }

  const burnInBtn = document.getElementById("btn-sim-burnin-shift");
  if (burnInBtn) burnInBtn.addEventListener("click", applyBurnInShift);

  if (toggleCursorBtn) {
    toggleCursorBtn.addEventListener("click", () => {
      state.mouseCursorVisible = !state.mouseCursorVisible;
      document.body.classList.toggle("show-cursor", state.mouseCursorVisible);
      toggleCursorBtn.textContent = state.mouseCursorVisible ? "Disable Mouse Cursor" : "Enable Mouse Cursor";
    });
  }
}

function toggleTechPanel(forceState) {
  const panel = document.getElementById("tech-panel");
  if (!panel) return;
  const shouldOpen = forceState !== undefined ? forceState : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !shouldOpen);
}

function updateTechMetrics(customStatus) {
  const statusEl = document.getElementById("metric-status");
  const timeEl = document.getElementById("metric-fetch-time");
  const countEl = document.getElementById("metric-items-count");
  const boardEl = document.getElementById("metric-active-board");

  if (statusEl) statusEl.textContent = customStatus || "Connected (Google Sheets)";
  if (timeEl && state.lastSyncTimestamp) timeEl.textContent = state.lastSyncTimestamp.toLocaleTimeString();
  if (countEl) countEl.textContent = `${state.currentData.length} items`;
  if (boardEl) boardEl.textContent = state.autoRotate ? `Auto-Cycle (${state.activeBoard})` : state.activeBoard;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
