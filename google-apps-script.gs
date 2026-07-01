/**
 * ============================================================
 * BHAVI RETAIL - INVENTORY & SALES MANAGEMENT SYSTEM
 * Google Apps Script Backend API
 * ============================================================
 * Owner Sheet ID is set in setup. Deploy this as a Web App:
 *   Deploy > New deployment > Type: Web app
 *   Execute as: Me | Who has access: Anyone
 * Then copy the Web App URL into app.js (API_URL constant).
 *
 * FIRST TIME SETUP:
 *   1. Open this script bound to a new/blank Google Sheet
 *      (or update SHEET_ID below to your target sheet).
 *   2. Run the function `setupSystem` once from the editor
 *      (select it in the dropdown, click Run). It will:
 *        - create all 13 sheets with headers
 *        - import your 109 products from Sheet1+Sheet3 of
 *          your uploaded Retail_shop.xlsx (already merged
 *          and embedded below as PRODUCT_SEED)
 *        - create a default Owner and Assistant login
 *   3. Authorize the script when prompted (it needs access
 *      to Sheets, Gmail, and external URLs for Telegram).
 * ============================================================
 */

// ====== CONFIGURATION ======
const OWNER_EMAIL = 'kasundmcc@gmail.com';
const SHEET_ID = '1sJXmgXbQKSrQ_MxZYctnTWpzoA2QxmcG7_zpR6FduYo'; // Falcon Dubai sheet
const TELEGRAM_BOT_TOKEN = ''; // Paste your bot token from @BotFather
const TELEGRAM_CHAT_ID_OWNER = '';    // Your Telegram numeric chat id
const TELEGRAM_CHAT_ID_ASSISTANT = ''; // Assistant's Telegram numeric chat id
const ASSISTANT_EMAIL = ''; // Assistant's email for Gmail notifications

// Default login credentials created by setupSystem (CHANGE THESE AFTER FIRST LOGIN)
const DEFAULT_OWNER_PIN = '1234';
const DEFAULT_ASSISTANT_PIN = '5678';

// ====== PRODUCT SEED DATA (merged from your uploaded Excel: Sheet1=stock, Sheet3=sales) ======
// Columns: code, barcode, name, category, supplier, buyingPrice, sellingPrice,
//          shippingCost, handlingCost, importCost, quantity, reorderLevel, description, images, status
const PRODUCT_SEED = [["BR1001", "", "Washing Powder", "General", "Dubai Import", 215.72, 350, 1000, 0, 64.05, 9.5, 5, "25kg", "", "Active"], ["BR1002", "", "Vimto", "General", "Dubai Import", 40, 2700, 0, 0, 0, 0, 5, "710ml", "", "Active"], ["BR1003", "", "Vaseline lip balm", "General", "Dubai Import", 40, 390, 0, 0, 0, 0, 5, "7g", "", "Active"], ["BR1004", "", "Turmeric Root", "General", "Dubai Import", 40, 105, 0, 0, 0, 0, 5, "250g", "", "Active"], ["BR1005", "", "Turmeric Powder", "General", "Dubai Import", 40, 325, 0, 0, 0, 0, 5, "50g", "", "Active"], ["BR1006", "", "Turmeric Powder", "General", "Dubai Import", 40, 580, 0, 0, 0, 0, 5, "100g", "", "Active"], ["BR1007", "", "Tresemme Shampoo & Conditioner", "General", "Dubai Import", 1932.39, 3500, 160, 0, 91.8, 4, 5, "400ml", "", "Active"], ["BR1008", "", "Tang Drink Powder", "General", "Dubai Import", 421, 900, 240, 0, 30, 3, 5, "375g", "", "Active"], ["BR1009", "", "Sunsilk Shampoo & Conditioner", "General", "Dubai Import", 1684, 3000, 80, 0, 40, 2, 5, "400ml", "", "Active"], ["BR1010", "", "Sunsilk", "General", "Dubai Import", 40, 750, 0, 0, 0, 0, 5, "200ml", "", "Active"], ["BR1011", "", "Spread Cheese Nadec", "General", "Dubai Import", 673.18, 2000, 80, 0, 15.99, 0, 5, "500g", "", "Active"], ["BR1012", "", "Spread Cheese Almarai", "General", "Dubai Import", 40, 1489, 0, 0, 0, 0, 5, "200g", "", "Active"], ["BR1013", "", "Spread Cheese Almarai", "General", "Dubai Import", 40, 2694, 0, 0, 0, 0, 5, "500g", "", "Active"], ["BR1014", "", "Spaghetti Emirates", "General", "Dubai Import", 40, 4699, 0, 0, 0, 0, 5, "400g", "", "Active"], ["BR1015", "", "Spaghetti", "General", "Dubai Import", 40, 950, 0, 0, 0, 0, 5, "500g", "", "Active"], ["BR1016", "", "Signal", "General", "Dubai Import", 40, 340, 0, 0, 0, 0, 5, "200g", "", "Active"], ["BR1017", "", "Shampoo", "General", "Dubai Import", 40, 750, 0, 0, 0, 0, 5, "200ml", "", "Active"], ["BR1018", "", "Sensodine", "General", "Dubai Import", 40, 1350, 0, 0, 0, 0, 5, "150g", "", "Active"], ["BR1019", "", "Salt", "General", "Dubai Import", 21.05, 120, 320, 0, 2, 0, 5, "1kg", "", "Active"], ["BR1020", "", "Rose Syrup Rooh Afza", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "800ml", "", "Active"], ["BR1021", "", "RDL Papaya Bodylotion", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "600ml", "", "Active"], ["BR1022", "", "RDL Bodylotion White", "General", "Dubai Import", 40, 2950, 0, 0, 0, 0, 5, "600ml", "", "Active"], ["BR1023", "", "Puck Cheese Triangle", "General", "Dubai Import", 40, 800, 0, 0, 0, 0, 5, "120g", "", "Active"], ["BR1024", "", "Puck Cheese spread", "General", "Dubai Import", 40, 3080, 0, 0, 0, 0, 5, "500g", "", "Active"], ["BR1025", "", "Pears baby soap", "General", "Dubai Import", 40, 190, 0, 0, 0, 0, 5, "90g", "", "Active"], ["BR1026", "", "Peanut Butter Spread", "General", "Dubai Import", 40, 1500, 0, 0, 0, 0, 5, "340g", "", "Active"], ["BR1027", "", "Peanut Butter Crunchy", "General", "Dubai Import", 40, 1500, 0, 0, 0, 0, 5, "340g", "", "Active"], ["BR1028", "", "Pastha", "General", "Dubai Import", 40, 600, 0, 0, 0, 0, 5, "1kg", "", "Active"], ["BR1029", "", "Pantene Shampoo", "General", "Dubai Import", 421, 1500, 160, 0, 20, 0, 5, "390ml", "", "Active"], ["BR1030", "", "Olive Oil", "General", "Dubai Import", 837.79, 2500, 480, 0, 119.4, 8, 5, "1l", "", "Active"], ["BR1031", "", "Olive Bottle", "General", "Dubai Import", 210.5, 1000, 480, 0, 30, 6, 5, "450g", "", "Active"], ["BR1032", "", "Olive Bottle", "General", "Dubai Import", 40, 1000, 0, 0, 0, 6, 5, "1l", "", "Active"], ["BR1033", "", "Nutella", "General", "Dubai Import", 40, 2000, 0, 0, 0, 2, 5, "15g", "", "Active"], ["BR1034", "", "Nutella", "General", "Dubai Import", 756.96, 2000, 200, 0, 44.95, 2, 5, "350g", "", "Active"], ["BR1035", "", "Nutella", "General", "Dubai Import", 40, 2000, 0, 0, 0, 2, 5, "500g", "", "Active"], ["BR1036", "", "Nutella", "General", "Dubai Import", 40, 6000, 0, 0, 0, 2, 5, "750g", "", "Active"], ["BR1037", "", "Nutella", "General", "Dubai Import", 40, 8500, 0, 0, 0, 2, 5, "1kg", "", "Active"], ["BR1038", "", "Nescafe 3 in 1", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1039", "", "Nescafe 2 in 1", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1040", "", "Nescafe", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1041", "", "Mumtaz Basmathi Rice", "General", "Dubai Import", 2693.56, 5000, 80, 0, 63.98, 4.25, 5, "5kg", "", "Active"], ["BR1042", "", "Mong Daal", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1043", "", "Milkmaid Condensed Milk", "General", "Dubai Import", 40, 790, 0, 0, 0, 0, 5, "390g", "", "Active"], ["BR1044", "", "Milkmaid Condensed Milk", "General", "Dubai Import", 40, 990, 0, 0, 0, 0, 5, "510g", "", "Active"], ["BR1045", "", "Mayonnaise", "General", "Dubai Import", 40, 3080, 0, 0, 0, 0, 5, "946ml", "", "Active"], ["BR1046", "", "Mayonnaise", "General", "Dubai Import", 40, 1700, 0, 0, 0, 0, 5, "295ml", "", "Active"], ["BR1047", "", "Mayonnaise", "General", "Dubai Import", 40, 3295, 0, 0, 0, 0, 5, "425ml", "", "Active"], ["BR1048", "", "Mayonnaise", "General", "Dubai Import", 40, 2887, 0, 0, 0, 0, 5, "887ml", "", "Active"], ["BR1049", "", "Matches Box", "General", "Dubai Import", 8.18, 20, 10, 0, 9.71, 90, 5, "1", "", "Active"], ["BR1050", "", "Lux Soap", "General", "Dubai Import", 40, 170, 0, 0, 0, 0, 5, "100g", "", "Active"], ["BR1051", "", "Kraft Cheese", "General", "Dubai Import", 408.79, 1200, 80, 0, 9.71, 0, 5, "190g", "", "Active"], ["BR1052", "", "Kojic Soap Original", "General", "Dubai Import", 40, 990, 0, 0, 0, 0, 5, "135g", "", "Active"], ["BR1053", "", "Kojic Soap Original", "General", "Dubai Import", 378.9, 800, 120, 0, 13.5, 0, 5, "100g", "", "Active"], ["BR1054", "", "Ketchup", "General", "Dubai Import", 223.97, 500, 240, 0, 15.96, 4, 5, "", "", "Active"], ["BR1055", "", "Jo Soap", "General", "Dubai Import", 97.67, 250, 480, 0, 13.92, 3, 5, "125g", "", "Active"], ["BR1056", "", "Intense", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1057", "", "Indome Noodles", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1058", "", "Himalaya Soap", "General", "Dubai Import", 97.67, 250, 480, 0, 13.92, 0, 5, "125g", "", "Active"], ["BR1059", "", "Harpic Toilet Cleaner", "General", "Dubai Import", 40, 675, 0, 0, 0, 0, 5, "750ml", "", "Active"], ["BR1060", "", "Ghee QBB", "General", "Dubai Import", 40, 7180, 0, 0, 0, 0, 5, "400g", "", "Active"], ["BR1061", "", "Ghee QBB", "General", "Dubai Import", 40, 9990, 0, 0, 0, 0, 5, "800ml", "", "Active"], ["BR1062", "", "Ghee Hayat Vegetable Ghee", "General", "Dubai Import", 40, 11500, 0, 0, 0, 0, 5, "1kg", "", "Active"], ["BR1063", "", "Ghee Aseel Vegetable Ghee", "General", "Dubai Import", 40, 1800, 0, 0, 0, 0, 5, "500ml", "", "Active"], ["BR1064", "", "Ghee Aseel Vegetable Ghee", "General", "Dubai Import", 40, 2350, 0, 0, 0, 0, 5, "1l", "", "Active"], ["BR1065", "", "Ghee Aseel Pure Butter", "General", "Dubai Import", 40, 3400, 0, 0, 0, 0, 5, "400ml", "", "Active"], ["BR1066", "", "Fruty Soap", "General", "Dubai Import", 84.03, 150, 1200, 0, 29.94, 3, 5, "75g", "", "Active"], ["BR1067", "", "Family pack Noodles", "General", "Dubai Import", 40, 380, 0, 0, 0, 0, 5, "5pcs", "", "Active"], ["BR1068", "", "Emirates Macaroni Penne", "General", "Dubai Import", 40, 4699, 0, 0, 0, 0, 5, "400g", "", "Active"], ["BR1069", "", "Dove Soap", "General", "Dubai Import", 40, 250, 0, 0, 0, 0, 5, "135g", "", "Active"], ["BR1070", "", "Dove Soap", "General", "Dubai Import", 40, 261, 0, 0, 0, 0, 5, "100g", "", "Active"], ["BR1071", "", "Dove Beauty Pink Soap", "General", "Dubai Import", 40, 290, 0, 0, 0, 0, 5, "75g", "", "Active"], ["BR1072", "", "Dishwash Vim", "General", "Dubai Import", 40, 428, 0, 0, 0, 0, 5, "500ml", "", "Active"], ["BR1073", "", "Dishwash Vim", "General", "Dubai Import", 40, 560, 0, 0, 0, 0, 5, "750ml", "", "Active"], ["BR1074", "", "Dishwash Fairy", "General", "Dubai Import", 40, 1947, 0, 0, 0, 0, 5, "600ml", "", "Active"], ["BR1075", "", "Dishwash Fairy", "General", "Dubai Import", 40, 2500, 0, 0, 0, 0, 5, "1l", "", "Active"], ["BR1076", "", "Dettol Soap", "General", "Dubai Import", 40, 185, 0, 0, 0, 0, 5, "100g", "", "Active"], ["BR1077", "", "Dates", "General", "Dubai Import", 40, 1500, 0, 0, 0, 0, 5, "1kg", "", "Active"], ["BR1078", "", "Cooking oil", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1079", "", "Conditioner", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1080", "", "Comfort Concernate", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "895ml", "", "Active"], ["BR1081", "", "Comfort", "General", "Dubai Import", 40, 1160, 0, 0, 0, 0, 5, "850ml", "", "Active"], ["BR1082", "", "Colgate", "General", "Dubai Import", 40, 450, 0, 0, 0, 0, 5, "150g", "", "Active"], ["BR1083", "", "Colgate", "General", "Dubai Import", 105.25, 200, 320, 0, 10, 0, 5, "75g", "", "Active"], ["BR1084", "", "Clove", "General", "Dubai Import", 40, 400, 0, 0, 0, 0, 5, "50g", "", "Active"], ["BR1085", "", "Close up", "General", "Dubai Import", 40, 285, 0, 0, 0, 0, 5, "120g", "", "Active"], ["BR1086", "", "Close up", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "75ml", "", "Active"], ["BR1087", "", "Clogard", "General", "Dubai Import", 40, 375, 0, 0, 0, 0, 5, "120g", "", "Active"], ["BR1088", "", "Clear Shampoo", "General", "Dubai Import", 546.88, 1499, 160, 0, 25.98, 0, 5, "350ml", "", "Active"], ["BR1089", "", "Cinthol Soap", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "125g", "", "Active"], ["BR1090", "", "Chicken Noodles", "General", "Dubai Import", 40, 115, 0, 0, 0, 0, 5, "73g", "", "Active"], ["BR1091", "", "Chicken Noodles", "General", "Dubai Import", 40, 220, 0, 0, 0, 0, 5, "146g", "", "Active"], ["BR1092", "", "Cashew", "General", "Dubai Import", 40, 3600, 0, 0, 0, 0, 5, "300g", "", "Active"], ["BR1093", "", "Carwash", "General", "Dubai Import", 40, 0, 0, 0, 0, 0, 5, "", "", "Active"], ["BR1094", "", "Cardamom", "General", "Dubai Import", 40, 1850, 0, 0, 0, 0, 5, "35g", "", "Active"], ["BR1095", "", "Body Lotion", "General", "Dubai Import", 378.48, 1000, 160, 0, 17.98, 1, 5, "", "", "Active"], ["BR1096", "", "Beau Monde Facial Scrub", "General", "Dubai Import", 421, 2000, 160, 0, 20, 1, 5, "", "", "Active"], ["BR1097", "", "Battery  AAA", "General", "Dubai Import", 40, 350, 0, 0, 0, 0, 5, "2pcs", "", "Active"], ["BR1098", "", "Battery  AA", "General", "Dubai Import", 40, 1300, 0, 0, 0, 0, 5, "4pcs", "", "Active"], ["BR1099", "", "Basmathi Rice", "General", "Dubai Import", 1136.7, 4000, 160, 0, 54, 2, 5, "5kg", "", "Active"], ["BR1100", "", "Anchor Milk Powder", "General", "Dubai Import", 40, 1200, 0, 0, 0, 0, 5, "400g", "", "Active"], ["BR1101", "", "Anchor Milk Powder", "General", "Dubai Import", 40, 2990, 0, 0, 0, 0, 5, "1kg", "", "Active"], ["BR1102", "", "Anchor Milk Powder", "General", "Dubai Import", 3789, 6000, 80, 0, 90, 0, 5, "2.25kg", "", "Active"], ["BR1103", "", "Almond", "General", "Dubai Import", 40, 654, 0, 0, 0, 0, 5, "75g", "", "Active"], ["BR1104", "", "Almarai", "General", "Dubai Import", 40, 9350, 0, 0, 0, 0, 5, "2.25kg", "", "Active"], ["BR1105", "", "Airfreshner machine refill", "General", "Dubai Import", 40, 2950, 0, 0, 0, 0, 5, "225ml", "", "Active"], ["BR1106", "", "Adidas Perfume", "General", "Dubai Import", 842, 2500, 200, 0, 50, 5, 5, "", "", "Active"], ["BR1107", "", "Mung Bean", "General", "Dubai Import", 462.59, 700, 600, 0, 82.41, 0, 5, "15kg", "", "Active"], ["BR1108", "", "Cycle Incense Stick", "General", "Dubai Import", 66.27, 120, 0, 0, 9.44, 0, 5, "", "", "Active"], ["BR1109", "", "Honey", "General", "Dubai Import", 40, 800, 120, 0, 0, 3, 5, "400g", "", "Active"]];

// ============================================================
// SHEET DEFINITIONS
// ============================================================
const SHEETS = {
  Products: ['Code','Barcode','Name','Category','Supplier','BuyingPrice','SellingPrice','ShippingCost','HandlingCost','ImportCost','Quantity','ReorderLevel','Description','Images','Status','ActualCost','Profit','ProfitPct','SuggestedPrice','StockValue','CreatedAt','UpdatedAt'],
  Categories: ['CategoryID','Name','Description'],
  Inventory: ['Date','ProductCode','ProductName','Type','QtyChange','Reason','Balance','UpdatedBy'],
  Sales: ['SaleID','Date','OrderID','ProductCode','ProductName','Qty','UnitPrice','Total','Cost','Profit','PaymentMethod','ServedBy'],
  Customers: ['CustomerID','Name','Phone','Email','Address','Password','RewardPoints','RegisteredAt'],
  Orders: ['OrderID','Date','CustomerID','CustomerName','Status','Subtotal','Discount','Shipping','Total','PaymentMethod','PaidAmount','Balance','DeliveryAddress','CreatedBy','Notes'],
  'Order Items': ['OrderID','ProductCode','ProductName','Qty','UnitPrice','LineTotal'],
  Expenses: ['Date','Category','Description','Amount','PaidBy'],
  'Shipping Charges': ['Date','OrderID','Carrier','Cost','TrackingNo'],
  Suppliers: ['SupplierID','Name','Phone','Email','Country','Notes'],
  Forecast: ['Date','ProductCode','PeriodType','PredictedRevenue','PredictedProfit','SuggestedPurchaseQty'],
  Settings: ['Key','Value'],
  Notifications: ['Date','Type','Message','Recipient','Status'],
  Users: ['UserID','Name','Role','Email','Phone','PIN','Status','CreatedAt']
};

function getSS() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  const ss = getSS();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,SHEETS[name].length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
  }
  return sh;
}

/**
 * RUN THIS ONCE to build the entire system: creates all sheets,
 * imports the 109 products, and creates default logins.
 * Check View > Logs (or View > Execution log) after running to confirm.
 */
function setupSystem() {
  Logger.log('Starting setup...');
  const ss = getSS();
  Logger.log('Target spreadsheet: ' + ss.getName() + ' (' + ss.getId() + ')');

  Object.keys(SHEETS).forEach(name => {
    getSheet(name);
    Logger.log('Sheet ready: ' + name);
  });

  const imported = importProducts_();
  Logger.log('Products imported: ' + imported);

  createDefaultUsers_();
  seedSettings_();

  SpreadsheetApp.flush();
  Logger.log('Setup complete.');
  return 'Setup complete. Spreadsheet: ' + ss.getName() + '. Products imported: ' + imported;
}

/**
 * Use this if setupSystem ran but Products is empty/stuck, or you want to
 * wipe and re-import fresh. WARNING: deletes all rows in Products below the header.
 */
function forceReimportProducts() {
  const sh = getSheet('Products');
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }
  const imported = importProducts_();
  SpreadsheetApp.flush();
  Logger.log('Force re-import complete. Products imported: ' + imported);
  return 'Force re-import complete. Products imported: ' + imported;
}

/**
 * Quick diagnostic — run this first if setupSystem seems to do nothing.
 * Shows exactly which spreadsheet the script is targeting and what sheets exist.
 */
function diagnose() {
  const ss = getSS();
  const names = ss.getSheets().map(s => s.getName());
  Logger.log('Spreadsheet name: ' + ss.getName());
  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Existing tabs: ' + names.join(', '));
  return { name: ss.getName(), id: ss.getId(), url: ss.getUrl(), tabs: names };
}

/**
 * Run this to test that Email + Telegram notifications are working
 * after filling in TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID_OWNER above.
 * Check your Telegram and email, then check the Notifications sheet
 * to confirm it logged as "Sent" (not "Failed").
 */
function testNotification() {
  sendNotification('Test Notification', 'This is a test message from your Bhavi Retail system. If you see this in Telegram and/or email, notifications are working correctly.');
  Logger.log('Test notification sent — check Telegram, email, and the Notifications sheet.');
}

function importProducts_() {
  const sh = getSheet('Products');
  if (sh.getLastRow() > 1) {
    Logger.log('Products sheet already has data (' + (sh.getLastRow()-1) + ' rows) — skipping import to avoid duplicates. Run forceReimportProducts() to wipe and re-import.');
    return 0;
  }
  const now = new Date();
  const rows = PRODUCT_SEED.map(p => {
    const [code, barcode, name, category, supplier, buyingPrice, sellingPrice, shippingCost, handlingCost, importCost, quantity, reorderLevel, description, images, status] = p;
    const actualCost = round2_(buyingPrice + shippingCost + handlingCost + importCost);
    const profit = round2_(sellingPrice - actualCost);
    const profitPct = actualCost > 0 ? round2_((profit / actualCost) * 100) : 0;
    const suggestedPrice = round2_(actualCost * 1.4); // default 40% markup suggestion
    const stockValue = round2_(actualCost * quantity);
    return [code, barcode, name, category, supplier, buyingPrice, sellingPrice, shippingCost, handlingCost, importCost, quantity, reorderLevel, description, images, status, actualCost, profit, profitPct, suggestedPrice, stockValue, now, now];
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

function createDefaultUsers_() {
  const sh = getSheet('Users');
  if (sh.getLastRow() > 1) return; // already set up
  const now = new Date();
  sh.appendRow(['U001','Owner','Owner', OWNER_EMAIL, '', DEFAULT_OWNER_PIN, 'Active', now]);
  sh.appendRow(['U002','Assistant','Assistant', ASSISTANT_EMAIL, '', DEFAULT_ASSISTANT_PIN, 'Active', now]);
}

function seedSettings_() {
  const sh = getSheet('Settings');
  if (sh.getLastRow() > 1) return;
  sh.appendRow(['BusinessName','Bhavi Retail']);
  sh.appendRow(['Currency','LKR']);
  sh.appendRow(['MonthlySalesTarget','500000']);
  sh.appendRow(['LowStockThreshold','5']);
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function genId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyMMddHHmmss') + Math.floor(Math.random()*90+10);
}

// ============================================================
// WEB APP ENTRY POINTS (called by app.js via fetch)
// ============================================================

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  let action = '';
  let params = {};
  try {
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
      action = params.action;
    } else {
      params = e.parameter;
      action = e.parameter.action;
    }

    let result;
    switch (action) {
      case 'login': result = login(params.identifier, params.pinOrPassword, params.role); break;
      case 'customerQuickLogin': result = customerQuickLogin(params.name, params.phone); break;
      case 'register': result = registerCustomer(params); break;
      case 'getProducts': result = getProducts(); break;
      case 'getProduct': result = getProductByCode(params.code); break;
      case 'saveProduct': result = saveProduct(params); break;
      case 'updateProduct': result = updateProduct(params); break;
      case 'deleteProduct': result = deleteProduct(params.code); break;
      case 'placeOrder': result = placeOrder(params); break;
      case 'updateOrder': result = updateOrder(params); break;
      case 'cancelOrder': result = cancelOrder(params.orderId); break;
      case 'getOrders': result = getOrders(params); break;
      case 'getDashboard': result = getDashboard(); break;
      case 'getForecast': result = getForecast(params.periodType); break;
      case 'getCustomers': result = getCustomers(); break;
      case 'getCustomerOrders': result = getCustomerOrders(params.customerId); break;
      case 'addExpense': result = addExpense(params); break;
      case 'getReports': result = getReports(params.reportType, params.range); break;
      case 'getInventoryLog': result = getInventoryLog(); break;
      case 'adjustStock': result = adjustStockApi(params); break;
      case 'getSettings': result = getSettingsApi(); break;
      case 'updateSettings': result = updateSettingsApi(params); break;
      case 'updatePin': result = updatePin(params.role, params.newPin); break;
      case 'addUser': result = addUser(params); break;
      case 'getUsers': result = getUsers(); break;
      case 'testNotification': result = testNotificationApi(); break;
      default: result = { success: false, error: 'Unknown action: ' + action };
    }
    return jsonOut_(result);
  } catch (err) {
    return jsonOut_({ success: false, error: err.message });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// AUTH: login() / registerCustomer()
// ============================================================

/**
 * Owner/Assistant login by PIN, or Customer login by phone+password.
 * role: 'Owner' | 'Assistant' | 'Customer'
 */
function login(identifier, pinOrPassword, role) {
  if (role === 'Customer') {
    const sh = getSheet('Customers');
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const [customerId, name, phone, email, address, password] = data[i];
      if ((phone === identifier || email === identifier) && String(password) === String(pinOrPassword)) {
        return { success: true, user: { id: customerId, name, phone, email, address, role: 'Customer' } };
      }
    }
    return { success: false, error: 'Invalid phone/email or password' };
  } else {
    const sh = getSheet('Users');
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const [userId, name, userRole, email, phone, pin, status] = data[i];
      if (String(pin) === String(pinOrPassword) && status === 'Active' &&
          (!role || userRole === role) && (!identifier || name === identifier)) {
        return { success: true, user: { id: userId, name, role: userRole, email, phone } };
      }
    }
    return { success: false, error: 'Invalid PIN' };
  }
}

function registerCustomer(p) {
  const sh = getSheet('Customers');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === p.phone) return { success: false, error: 'Phone number already registered' };
  }
  const id = genId_('CUST');
  sh.appendRow([id, p.name, p.phone, p.email || '', p.address || '', p.password, 0, new Date()]);
  return { success: true, customerId: id };
}

/**
 * Customer-friendly login: just name + mobile number, no password.
 * If the phone number already exists, logs them in (updates name if changed).
 * If it's a new phone number, creates the account on the spot.
 * The front end then stores the result in localStorage indefinitely,
 * so the customer stays "remembered" across visits until they clear
 * their browser or explicitly log out.
 */
function customerQuickLogin(name, phone) {
  if (!name || !phone) return { success: false, error: 'Name and mobile number are required' };
  const sh = getSheet('Customers');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(phone).trim()) {
      // existing customer — keep name in sync if they typed it differently
      if (data[i][1] !== name) sh.getRange(i + 1, 2).setValue(name);
      return {
        success: true,
        user: { id: data[i][0], name, phone, email: data[i][3], address: data[i][4], rewardPoints: data[i][6], role: 'Customer' }
      };
    }
  }
  // new customer — create instantly, no password needed
  const id = genId_('CUST');
  const now = new Date();
  sh.appendRow([id, name, phone, '', '', '', 0, now]);
  return { success: true, user: { id, name, phone, email: '', address: '', rewardPoints: 0, role: 'Customer' } };
}

// ============================================================
// PRODUCTS: getProducts / saveProduct / updateProduct / deleteProduct
// ============================================================

function getProducts() {
  const sh = getSheet('Products');
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const products = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    products.push(obj);
  }
  return { success: true, products };
}

function getProductByCode(code) {
  const r = getProducts();
  const p = r.products.find(p => p.Code === code);
  return p ? { success: true, product: p } : { success: false, error: 'Product not found' };
}

function recalcProductFields_(p) {
  const buying = Number(p.buyingPrice || p.BuyingPrice || 0);
  const ship = Number(p.shippingCost || p.ShippingCost || 0);
  const handling = Number(p.handlingCost || p.HandlingCost || 0);
  const importC = Number(p.importCost || p.ImportCost || 0);
  const selling = Number(p.sellingPrice || p.SellingPrice || 0);
  const qty = Number(p.quantity || p.Quantity || 0);
  const actualCost = round2_(buying + ship + handling + importC);
  const profit = round2_(selling - actualCost);
  const profitPct = actualCost > 0 ? round2_((profit / actualCost) * 100) : 0;
  const suggestedPrice = round2_(actualCost * 1.4);
  const stockValue = round2_(actualCost * qty);
  return { actualCost, profit, profitPct, suggestedPrice, stockValue };
}

function saveProduct(p) {
  const sh = getSheet('Products');
  const code = p.code || genId_('BR');
  const calc = recalcProductFields_(p);
  const now = new Date();
  sh.appendRow([
    code, p.barcode || '', p.name, p.category, p.supplier,
    Number(p.buyingPrice)||0, Number(p.sellingPrice)||0, Number(p.shippingCost)||0,
    Number(p.handlingCost)||0, Number(p.importCost)||0, Number(p.quantity)||0,
    Number(p.reorderLevel)||5, p.description || '', p.images || '', p.status || 'Active',
    calc.actualCost, calc.profit, calc.profitPct, calc.suggestedPrice, calc.stockValue, now, now
  ]);
  return { success: true, code };
}

function updateProduct(p) {
  const sh = getSheet('Products');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.code) {
      const calc = recalcProductFields_(p);
      const row = i + 1;
      const now = new Date();
      sh.getRange(row, 1, 1, 22).setValues([[
        p.code, p.barcode || '', p.name, p.category, p.supplier,
        Number(p.buyingPrice)||0, Number(p.sellingPrice)||0, Number(p.shippingCost)||0,
        Number(p.handlingCost)||0, Number(p.importCost)||0, Number(p.quantity)||0,
        Number(p.reorderLevel)||5, p.description || '', p.images || '', p.status || 'Active',
        calc.actualCost, calc.profit, calc.profitPct, calc.suggestedPrice, calc.stockValue,
        data[i][20], now
      ]]);
      return { success: true };
    }
  }
  return { success: false, error: 'Product not found' };
}

function deleteProduct(code) {
  // NOTE: Per spec, Assistant role cannot delete — enforce that check in the front-end
  // before calling this action, and/or pass role here for a server-side check.
  const sh = getSheet('Products');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      sh.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Product not found' };
}

function adjustStock_(code, qtyChange, reason, updatedBy) {
  const sh = getSheet('Products');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      const row = i + 1;
      const newQty = Number(data[i][10]) + qtyChange;
      sh.getRange(row, 11).setValue(newQty);
      const calc = recalcProductFields_({
        buyingPrice: data[i][5], sellingPrice: data[i][6], shippingCost: data[i][7],
        handlingCost: data[i][8], importCost: data[i][9], quantity: newQty
      });
      sh.getRange(row, 16, 1, 4).setValues([[calc.actualCost, calc.profit, calc.profitPct, calc.suggestedPrice]]);
      sh.getRange(row, 20).setValue(calc.stockValue);

      const inv = getSheet('Inventory');
      inv.appendRow([new Date(), code, data[i][2], qtyChange > 0 ? 'IN' : 'OUT', qtyChange, reason, newQty, updatedBy || '']);
      return newQty;
    }
  }
  return null;
}

// ============================================================
// ORDERS: placeOrder / updateOrder / cancelOrder / getOrders
// ============================================================

/**
 * params = {
 *   customerId, customerName, items: [{code,name,qty,unitPrice}],
 *   discount, shipping, paymentMethod, paidAmount, deliveryAddress, createdBy, notes
 * }
 */
function placeOrder(params) {
  const items = typeof params.items === 'string' ? JSON.parse(params.items) : params.items;
  if (!items || !items.length) return { success: false, error: 'No items in order' };

  const orderId = genId_('ORD');
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) * Number(it.unitPrice)), 0);
  const discount = Number(params.discount) || 0;
  const shipping = Number(params.shipping) || 0;
  const total = round2_(subtotal - discount + shipping);
  const paid = Number(params.paidAmount) || 0;
  const balance = round2_(total - paid);

  const ordersSh = getSheet('Orders');
  ordersSh.appendRow([
    orderId, new Date(), params.customerId || '', params.customerName || 'Walk-in',
    'Pending', subtotal, discount, shipping, total, params.paymentMethod || 'Cash',
    paid, balance, params.deliveryAddress || '', params.createdBy || '', params.notes || ''
  ]);

  const itemsSh = getSheet('Order Items');
  const salesSh = getSheet('Sales');
  items.forEach(it => {
    const lineTotal = round2_(Number(it.qty) * Number(it.unitPrice));
    itemsSh.appendRow([orderId, it.code, it.name, it.qty, it.unitPrice, lineTotal]);

    // deduct stock
    const newQty = adjustStock_(it.code, -Number(it.qty), 'Sale ' + orderId, params.createdBy);

    // record sale + profit
    const prod = getProductByCode(it.code);
    const cost = prod.success ? Number(prod.product.ActualCost) * Number(it.qty) : 0;
    const profit = round2_(lineTotal - cost);
    salesSh.appendRow([genId_('SL'), new Date(), orderId, it.code, it.name, it.qty, it.unitPrice, lineTotal, cost, profit, params.paymentMethod || 'Cash', params.createdBy || '']);
  });

  // notify owner + assistant
  sendNotification('New Order', buildOrderNotificationText_(orderId, params, items, total));

  return { success: true, orderId, total, balance };
}

function buildOrderNotificationText_(orderId, params, items, total) {
  const lines = items.map(it => `- ${it.name} x${it.qty} @ Rs.${it.unitPrice}`).join('\n');
  return `New Order: ${orderId}\nCustomer: ${params.customerName || 'Walk-in'}\nItems:\n${lines}\nTotal: Rs.${total}\nPayment: ${params.paymentMethod || 'Cash'}\nDelivery: ${params.deliveryAddress || 'N/A'}`;
}

function updateOrder(params) {
  const sh = getSheet('Orders');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.orderId) {
      const row = i + 1;
      if (params.status) sh.getRange(row, 5).setValue(params.status);
      if (params.paidAmount !== undefined) {
        sh.getRange(row, 11).setValue(Number(params.paidAmount));
        sh.getRange(row, 12).setValue(round2_(Number(data[i][8]) - Number(params.paidAmount)));
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Order not found' };
}

function cancelOrder(orderId) {
  const sh = getSheet('Orders');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      sh.getRange(i + 1, 5).setValue('Cancelled');
      // restore stock
      const itemsSh = getSheet('Order Items');
      const itemsData = itemsSh.getDataRange().getValues();
      for (let j = 1; j < itemsData.length; j++) {
        if (itemsData[j][0] === orderId) {
          adjustStock_(itemsData[j][1], Number(itemsData[j][3]), 'Cancelled ' + orderId, 'System');
        }
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Order not found' };
}

function getOrders(params) {
  const sh = getSheet('Orders');
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    if (params && params.customerId && obj.CustomerID !== params.customerId) continue;
    if (params && params.status && obj.Status !== params.status) continue;
    orders.push(obj);
  }
  return { success: true, orders: orders.reverse() };
}

function getCustomerOrders(customerId) {
  return getOrders({ customerId });
}

function getCustomers() {
  const sh = getSheet('Customers');
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const customers = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    delete obj.Password;
    customers.push(obj);
  }
  return { success: true, customers };
}

function addExpense(p) {
  const sh = getSheet('Expenses');
  sh.appendRow([new Date(), p.category, p.description, Number(p.amount), p.paidBy || '']);
  return { success: true };
}

// ============================================================
// NOTIFICATIONS: Gmail (free) + Telegram (free)
// ============================================================

function sendNotification(subject, message) {
  const log = getSheet('Notifications');

  // Email via Gmail (free, uses your Apps Script quota)
  try {
    const recipients = [OWNER_EMAIL, ASSISTANT_EMAIL].filter(Boolean).join(',');
    if (recipients) {
      MailApp.sendEmail(recipients, '[Bhavi Retail] ' + subject, message);
      log.appendRow([new Date(), 'Email', message, recipients, 'Sent']);
    }
  } catch (err) {
    log.appendRow([new Date(), 'Email', message, 'N/A', 'Failed: ' + err.message]);
  }

  // Telegram (free, via Bot API)
  if (TELEGRAM_BOT_TOKEN) {
    [TELEGRAM_CHAT_ID_OWNER, TELEGRAM_CHAT_ID_ASSISTANT].filter(Boolean).forEach(chatId => {
      try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ chat_id: chatId, text: '[Bhavi Retail] ' + subject + '\n\n' + message })
        });
        log.appendRow([new Date(), 'Telegram', message, chatId, 'Sent']);
      } catch (err) {
        log.appendRow([new Date(), 'Telegram', message, chatId, 'Failed: ' + err.message]);
      }
    });
  }
}

// ============================================================
// DASHBOARD: getDashboard()
// ============================================================

function getDashboard() {
  const productsR = getProducts();
  const ordersR = getOrders({});
  const salesSh = getSheet('Sales');
  const expensesSh = getSheet('Expenses');

  const today = new Date();
  const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
  const monthStr = Utilities.formatDate(today, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM');

  const salesData = salesSh.getDataRange().getValues();
  let todaySales = 0, monthSales = 0, monthProfit = 0;
  const productTotals = {}; // for fast/slow moving + top selling
  const monthlyRevenue = {}; // for chart: {yyyy-MM: total}

  for (let i = 1; i < salesData.length; i++) {
    const [, date, , code, name, qty, , total, , profit] = salesData[i];
    if (!date) continue;
    const d = new Date(date);
    const dStr = Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
    const mStr = Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM');
    if (dStr === todayStr) todaySales += Number(total);
    if (mStr === monthStr) { monthSales += Number(total); monthProfit += Number(profit); }
    monthlyRevenue[mStr] = (monthlyRevenue[mStr] || 0) + Number(total);
    productTotals[code] = productTotals[code] || { name, qty: 0, revenue: 0 };
    productTotals[code].qty += Number(qty);
    productTotals[code].revenue += Number(total);
  }

  let monthExpenses = 0;
  const expData = expensesSh.getDataRange().getValues();
  for (let i = 1; i < expData.length; i++) {
    const [date, , , amount] = expData[i];
    if (!date) continue;
    const mStr = Utilities.formatDate(new Date(date), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM');
    if (mStr === monthStr) monthExpenses += Number(amount);
  }

  const products = productsR.products;
  const inventoryValue = products.reduce((s, p) => s + Number(p.StockValue || 0), 0);
  const lowStock = products.filter(p => Number(p.Quantity) <= Number(p.ReorderLevel) && Number(p.Quantity) > 0);
  const outOfStock = products.filter(p => Number(p.Quantity) <= 0);

  const orders = ordersR.orders;
  const pendingOrders = orders.filter(o => o.Status === 'Pending').length;
  const completedOrders = orders.filter(o => o.Status === 'Completed').length;
  const cancelledOrders = orders.filter(o => o.Status === 'Cancelled').length;

  const sortedByQty = Object.entries(productTotals).sort((a, b) => b[1].qty - a[1].qty);
  const topSelling = sortedByQty.slice(0, 10).map(([code, v]) => ({ code, ...v }));
  const fastMoving = sortedByQty.slice(0, 5).map(([code, v]) => ({ code, ...v }));
  const slowMoving = sortedByQty.slice(-5).reverse().map(([code, v]) => ({ code, ...v }));

  const settingsSh = getSheet('Settings');
  const settingsData = settingsSh.getDataRange().getValues();
  let salesTarget = 0;
  for (let i = 1; i < settingsData.length; i++) {
    if (settingsData[i][0] === 'MonthlySalesTarget') salesTarget = Number(settingsData[i][1]);
  }

  return {
    success: true,
    todaySales: round2_(todaySales),
    monthSales: round2_(monthSales),
    monthProfit: round2_(monthProfit),
    monthExpenses: round2_(monthExpenses),
    inventoryValue: round2_(inventoryValue),
    pendingOrders, completedOrders, cancelledOrders,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockItems: lowStock.slice(0, 20),
    topSelling, fastMoving, slowMoving,
    latestOrders: orders.slice(0, 10),
    recentCustomers: getCustomers().customers.slice(-10).reverse(),
    salesTarget,
    monthlyRevenue: Object.entries(monthlyRevenue).sort().map(([month, total]) => ({ month, total: round2_(total) }))
  };
}

// ============================================================
// FORECAST: simple moving-average based projection
// ============================================================

function getForecast(periodType) {
  const salesSh = getSheet('Sales');
  const data = salesSh.getDataRange().getValues();
  const monthly = {}; // {yyyy-MM: {revenue, profit}}
  for (let i = 1; i < data.length; i++) {
    const [, date, , , , , , total, , profit] = data[i];
    if (!date) continue;
    const mStr = Utilities.formatDate(new Date(date), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM');
    monthly[mStr] = monthly[mStr] || { revenue: 0, profit: 0 };
    monthly[mStr].revenue += Number(total);
    monthly[mStr].profit += Number(profit);
  }
  const months = Object.keys(monthly).sort();
  const last3 = months.slice(-3).map(m => monthly[m]);
  const avgRevenue = last3.length ? last3.reduce((s, m) => s + m.revenue, 0) / last3.length : 0;
  const avgProfit = last3.length ? last3.reduce((s, m) => s + m.profit, 0) / last3.length : 0;

  const multipliers = { week: 0.25, month: 1, '3months': 3, '6months': 6 };
  const mult = multipliers[periodType] || 1;

  // Suggested purchase qty: based on products sold faster than current stock covers (simple reorder logic)
  const productsR = getProducts();
  const suggestions = productsR.products
    .filter(p => Number(p.Quantity) <= Number(p.ReorderLevel) * 2)
    .map(p => ({ code: p.Code, name: p.Name, currentStock: p.Quantity, suggestedQty: Math.max(Number(p.ReorderLevel) * 3 - Number(p.Quantity), 0) }));

  return {
    success: true,
    periodType: periodType || 'month',
    predictedRevenue: round2_(avgRevenue * mult),
    predictedProfit: round2_(avgProfit * mult),
    suggestedPurchases: suggestions,
    historicalMonthly: months.map(m => ({ month: m, revenue: round2_(monthly[m].revenue), profit: round2_(monthly[m].profit) }))
  };
}

// ============================================================
// REPORTS
// ============================================================

function getReports(reportType, range) {
  switch (reportType) {
    case 'fastSlowMoving': return getDashboard(); // reuse computed lists
    case 'abc': return abcAnalysis_();
    case 'deadStock': return deadStockReport_();
    default:
      return { success: false, error: 'Unknown report type: ' + reportType };
  }
}

function abcAnalysis_() {
  const dash = getDashboard();
  const sorted = dash.topSelling.slice().sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sorted.reduce((s, p) => s + p.revenue, 0);
  let cumulative = 0;
  const classified = sorted.map(p => {
    cumulative += p.revenue;
    const pct = totalRevenue ? (cumulative / totalRevenue) * 100 : 0;
    const grade = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    return { ...p, cumulativePct: round2_(pct), grade };
  });
  return { success: true, classified };
}

function deadStockReport_() {
  const productsR = getProducts();
  const salesSh = getSheet('Sales');
  const soldCodes = new Set();
  const data = salesSh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) soldCodes.add(data[i][3]);
  const dead = productsR.products.filter(p => !soldCodes.has(p.Code) && Number(p.Quantity) > 0);
  return { success: true, deadStock: dead };
}

// ============================================================
// ADDITIONAL API FUNCTIONS
// ============================================================

function getInventoryLog() {
  const sh = getSheet('Inventory');
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const log = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    log.push(obj);
  }
  return { success: true, log: log.reverse() };
}

function adjustStockApi(p) {
  const newQty = adjustStock_(p.code, Number(p.qtyChange), p.reason, p.updatedBy);
  if (newQty === null) return { success: false, error: 'Product not found' };
  return { success: true, newQty };
}

function getSettingsApi() {
  const sh = getSheet('Settings');
  const data = sh.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) settings[data[i][0]] = data[i][1];
  }
  return { success: true, settings };
}

function updateSettingsApi(p) {
  const sh = getSheet('Settings');
  const data = sh.getDataRange().getValues();
  const keys = Object.keys(p).filter(k => k !== 'action');
  keys.forEach(key => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sh.getRange(i + 1, 2).setValue(p[key]);
        found = true; break;
      }
    }
    if (!found) sh.appendRow([key, p[key]]);
  });
  return { success: true };
}

function updatePin(role, newPin) {
  const sh = getSheet('Users');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === role) {
      sh.getRange(i + 1, 6).setValue(String(newPin));
      return { success: true };
    }
  }
  return { success: false, error: 'Role not found' };
}

function addUser(p) {
  const sh = getSheet('Users');
  const id = genId_('U');
  sh.appendRow([id, p.name, p.role || 'Assistant', p.email || '', p.phone || '', String(p.pin), 'Active', new Date()]);
  return { success: true, userId: id };
}

function getUsers() {
  const sh = getSheet('Users');
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const users = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => { if (h !== 'PIN') obj[h] = data[i][idx]; });
    users.push(obj);
  }
  return { success: true, users };
}

function testNotificationApi() {
  sendNotification('Test Notification', 'This is a test message from your Falcon Dubai Retail system. Notifications are working correctly!');
  return { success: true };
}
