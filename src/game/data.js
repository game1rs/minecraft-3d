// ============================================================
// 🌱 Grow a Garden — game data & balance constants
// ============================================================

export const SAVE_KEY = 'grow-a-garden-save-v1'
export const GRID = 5                 // 5×5 plot grid
export const START_PLOTS = 4          // plots unlocked at the start (center 2×2)
export const START_COINS = 50

export const WATER_MULT = 1.5         // growth speed multiplier while watered / raining
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000   // max offline growth credit: 8h

// --- Crops -------------------------------------------------
// growth = seconds to full maturity (unwatered)
export const CROPS = {
  carrot: {
    id: 'carrot', name: 'Carrot', emoji: '🥕', color: '#f97316',
    seedCost: 10, growth: 5, yield: 1, sellPrice: 20, xp: 3,
    unlockLevel: 1, blurb: 'Crunchy, quick and always reliable.',
  },
  tomato: {
    id: 'tomato', name: 'Tomato', emoji: '🍅', color: '#ef4444',
    seedCost: 25, growth: 12, yield: 1, sellPrice: 48, xp: 6,
    unlockLevel: 1, blurb: 'A juicy step up for serious gardeners.',
  },
  corn: {
    id: 'corn', name: 'Corn', emoji: '🌽', color: '#eab308',
    seedCost: 60, growth: 25, yield: 2, sellPrice: 65, xp: 14,
    unlockLevel: 3, blurb: 'Tall stalks that pop out two ears each.',
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', color: '#ea580c',
    seedCost: 140, growth: 45, yield: 1, sellPrice: 320, xp: 26,
    unlockLevel: 5, blurb: 'Slow to swell, huge at the market.',
  },
  goldenberry: {
    id: 'goldenberry', name: 'Golden Berry', emoji: '🫐', color: '#f59e0b',
    seedCost: 400, growth: 90, yield: 1, sellPrice: 1050, xp: 60,
    unlockLevel: 8, blurb: 'A rare glimmering berry for master growers.',
  },
}
export const CROP_ORDER = ['carrot', 'tomato', 'corn', 'pumpkin', 'goldenberry']

// --- Mutations (rolled when the seed goes into the soil) -----
export const MUTATIONS = {
  giant: {
    id: 'giant', name: 'Giant', mult: 3.5, chance: 0.04,
    badge: 'bg-emerald-500 text-white', desc: '3.5× sell value',
  },
  golden: {
    id: 'golden', name: 'Golden', mult: 5, chance: 0.02,
    badge: 'bg-amber-400 text-amber-950', desc: '5× sell value',
  },
}

// --- Tools ---------------------------------------------------
export const TOOL_IDS = ['hand', 'water', 'trowel', 'spray', 'fertilizer']
export const TOOLS = {
  hand:       { id: 'hand',       name: 'Harvest Hand', label: 'Hand',  hotkey: '1', color: '#22c55e', desc: 'Harvest ripe crops & pull weeds' },
  water:      { id: 'water',      name: 'Watering Can', label: 'Water', hotkey: '2', color: '#0ea5e9', desc: '+50% growth speed until harvest' },
  trowel:     { id: 'trowel',     name: 'Trowel',       label: 'Trowel', hotkey: '3', color: '#b45309', desc: 'Clear plants, weeds & withered crops' },
  spray:      { id: 'spray',      name: 'Pest Spray',   label: 'Spray', hotkey: '4', color: '#a855f7', desc: 'Spray away pest infestations 🐛' },
  fertilizer: { id: 'fertilizer', name: 'Fertilizer',   label: 'Boost', hotkey: '5', color: '#f43f5e', desc: 'Instant growth boost (consumable)' },
}

// --- Shop: supplies & upgrades --------------------------------
export const FERTILIZER_BOOST = 0.3          // +30% instant growth
export const FERTILIZER_BOOST_DELUXE = 0.6   // with the Deluxe upgrade

export const SUPPLIES = {
  fertilizer: {
    id: 'fertilizer', name: 'Fertilizer', emoji: '⚡',
    price: 40, bulkQty: 5, bulkPrice: 180,
    blurb: `Instantly boosts one growing crop by +${FERTILIZER_BOOST * 100}%.`,
  },
}

export const BACKPACK_TIERS = [
  { cap: 20,  cost: 0 },
  { cap: 40,  cost: 450 },
  { cap: 80,  cost: 1400 },
  { cap: 160, cost: 4000 },
]

export const UPGRADES = {
  goldenCan: {
    id: 'goldenCan', name: 'Golden Watering Can', icon: '💧', cost: 1200,
    blurb: 'Waters a whole 3×3 area at once.',
  },
  deluxeFert: {
    id: 'deluxeFert', name: 'Deluxe Fertilizer', icon: '✨', cost: 2500,
    blurb: `Fertilizer boosts +${FERTILIZER_BOOST_DELUXE * 100}% instead of +${FERTILIZER_BOOST * 100}%.`,
  },
}

// --- Random events ---------------------------------------------
export const INFEST = {
  weeds: { deadline: 30, name: 'Weeds', emoji: '🌿', action: 'pull them (Hand / Trowel)' },
  pests: { deadline: 25, name: 'Pests', emoji: '🐛', action: 'spray them (Pest Spray)' },
}
export const RAIN = { min: 14, max: 22 }        // rain duration (seconds)
export const EVENT_GAP = [26, 48]               // seconds between event rolls
export const RAIN_COOLDOWN = 150_000            // min ms between rains

// --- Progression -----------------------------------------------
export const xpToNext = (level) => Math.round(50 * Math.pow(level, 1.35))
export const levelReward = (level) => level * 25
export const plotCost = (unlockedCount) =>
  Math.round(75 * Math.pow(1.32, Math.max(0, unlockedCount - START_PLOTS)))

// --- Small helpers ----------------------------------------------
export const fmt = (n) => Math.round(n).toLocaleString('en-US')
export const fmtDur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${sec}s`
  return `${sec}s`
}
export const sellPrice = (cropId, mutation) =>
  Math.round(CROPS[cropId].sellPrice * (mutation && MUTATIONS[mutation] ? MUTATIONS[mutation].mult : 1))
export const inventoryUsed = (inv) => Object.values(inv).reduce((a, b) => a + b, 0)
export const skuParts = (sku) => {
  const [cropId, mut] = sku.split(':')
  return { cropId, mutation: mut === 'normal' ? null : mut }
}
export const makeSku = (cropId, mutation) => `${cropId}:${mutation || 'normal'}`
export const randRange = ([min, max]) => min + Math.random() * (max - min)
