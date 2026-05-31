#!/usr/bin/env node
/**
 * Crave 品類診斷 — 實測哪些 googleType 是 Google Places API (New) 有效的 primary type，
 * 並在指定地點（預設信義區）看各 type 實際有幾家店。
 *
 * 用法（key 留在你本機、不經過任何人）：
 *   node diag-types.mjs YOUR_API_KEY
 *   node diag-types.mjs YOUR_API_KEY 25.0330 121.5654   (自訂 lat lng)
 *
 * 輸出每個 type：
 *   ✓ N 家   = 有效且該區有 N 家
 *   ⚠ 0 家   = type 有效但該區沒有（或 type 無效但 API 靜默回空）
 *   ✗ 錯誤    = type 無效（API 明確報錯，這就是「永遠不出現」的元兇）
 */

const KEY = process.argv[2];
const LAT = parseFloat(process.argv[3] || '25.0330'); // 信義區附近
const LNG = parseFloat(process.argv[4] || '121.5654');
const RADIUS = 1500;

if (!KEY) {
  console.error('請帶 API key： node diag-types.mjs YOUR_API_KEY');
  process.exit(1);
}

// 現行 22 個 + 候選要新增的（牛排/海鮮/漢堡/早餐/麵包/素食/酒吧/三明治…）
const CURRENT = [
  'ramen_restaurant','sushi_restaurant','yakiniku_restaurant','japanese_curry_restaurant',
  'tonkatsu_restaurant','japanese_izakaya_restaurant','japanese_restaurant','hot_pot_restaurant',
  'korean_restaurant','thai_restaurant','vietnamese_restaurant','cantonese_restaurant',
  'chinese_noodle_restaurant','chinese_restaurant','taiwanese_restaurant','italian_restaurant',
  'pizza_restaurant','american_restaurant','brunch_restaurant','fast_food_restaurant',
  'cafe','dessert_restaurant',
];
const CANDIDATES = [
  'steak_house','seafood_restaurant','hamburger_restaurant','breakfast_restaurant',
  'bakery','vegetarian_restaurant','vegan_restaurant','sandwich_shop','bar',
  'barbecue_restaurant','indian_restaurant','mexican_restaurant','french_restaurant',
  'spanish_restaurant','mediterranean_restaurant','asian_restaurant','bar_and_grill',
  'fine_dining_restaurant','diner','buffet_restaurant','meal_takeaway','food_court',
  'ice_cream_shop','juice_shop','tea_house','bagel_shop','deli','donut_shop',
];

async function probe(type) {
  const body = {
    includedPrimaryTypes: [type],
    maxResultCount: 5,
    locationRestriction: { circle: { center: { latitude: LAT, longitude: LNG }, radius: RADIUS } },
    languageCode: 'zh-TW', regionCode: 'TW',
  };
  const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    // 無效 type 通常回 400 + "Invalid included primary type"
    return { ok: false, err: `HTTP ${r.status}: ${t.slice(0, 120)}` };
  }
  const data = await r.json();
  return { ok: true, count: (data.places || []).length };
}

async function run(label, list) {
  console.log(`\n===== ${label} =====`);
  for (const type of list) {
    try {
      const res = await probe(type);
      if (!res.ok) console.log(`  ✗ ${type.padEnd(30)} 錯誤（很可能是無效 type）: ${res.err}`);
      else if (res.count === 0) console.log(`  ⚠ ${type.padEnd(30)} 0 家（type 有效但該區沒有，或靜默無效）`);
      else console.log(`  ✓ ${type.padEnd(30)} ${res.count} 家`);
    } catch (e) {
      console.log(`  ! ${type.padEnd(30)} 例外: ${e.message}`);
    }
    await new Promise((s) => setTimeout(s, 120)); // 輕節流
  }
}

(async () => {
  console.log(`診斷地點: ${LAT}, ${LNG}  半徑 ${RADIUS}m`);
  await run('現行 22 個 type（看哪些報錯 = 永遠不出現的元兇）', CURRENT);
  await run('候選新增 type（看哪些有效可加，含牛排 steak_house）', CANDIDATES);
  console.log('\n判讀：✗ 錯誤 = 無效 type 要砍；候選裡 ✓ 的可以加進轉盤。');
  console.log('黑白切/乾麵/小吃若全程沒有對應 type → 證實 Google 無細分類，需走 text search 補。');
})();
