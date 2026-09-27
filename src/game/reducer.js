// ============================================================
// 🧠 Game reducer — all gameplay logic lives here.
// The reducer is intentionally "fat": it validates every action,
// mutates a cloned draft and emits transient `fx` events
// (sounds, floating texts, toasts, banners) that the useGame
// hook consumes and clears. This keeps game rules in one place.
// ============================================================
import {
  CROPS, CROP_ORDER, MUTATIONS, GRID, START_PLOTS, START_COINS, WATER_MULT,
  OFFLINE_CAP_MS, INFEST, RAIN, EVENT_GAP, RAIN_COOLDOWN, BACKPACK_TIERS, UPGRADES,
  SUPPLIES, FERTILIZER_BOOST, FERTILIZER_BOOST_DELUXE,
  xpToNext, levelReward, plotCost, sellPrice, inventoryUsed, skuParts, makeSku,
  randRange, fmt, fmtDur,
} from './data'

const isStartPlot = (row, col) => (row === 1 || row === 2) && (col === 1 || col === 2)
const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// ------------------------------------------------------------
// Initial state
// ------------------------------------------------------------
export function createInitialState(now = Date.now()) {
  const plots = []
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      plots.push({ id: row * GRID + col, row, col, unlocked: isStartPlot(row, col), crop: null })
    }
  }
  return {
    version: 1,
    coins: START_COINS,
    level: 1,
    xp: 0,
    plots,
    seeds: { carrot: 3, tomato: 0, corn: 0, pumpkin: 0, goldenberry: 0 },
    inventory: {},                       // sku ("crop:mutation") -> count
    inventoryCap: BACKPACK_TIERS[0].cap,
    backpackTier: 0,
    fertilizer: 1,
    upgrades: { goldenCan: false, deluxeFert: false },
    weather: { rainUntil: 0, lastRainAt: 0 },
    nextEventAt: now + 18000,
    soundOn: true,
    stats: { planted: 0, harvested: 0, earned: 0, spent: 0, mutations: 0 },
    lastTick: now,
    fx: [],
    fxSeq: 1,
  }
}

// Rehydrate a save file into a full, safe state object.
export function hydrate(save, now = Date.now()) {
  const s = createInitialState(now)
  if (!save || save.version !== 1) return s

  s.coins = Math.max(0, num(save.coins, s.coins))
  s.level = Math.max(1, num(save.level, 1))
  s.xp = Math.max(0, num(save.xp, 0))
  s.seeds = { ...s.seeds, ...(save.seeds || {}) }
  s.inventory = { ...(save.inventory || {}) }
  s.inventoryCap = Math.max(1, num(save.inventoryCap, s.inventoryCap))
  s.backpackTier = Math.max(0, num(save.backpackTier, 0))
  s.fertilizer = Math.max(0, num(save.fertilizer, 0))
  s.upgrades = { ...s.upgrades, ...(save.upgrades || {}) }
  s.weather = { ...s.weather, ...(save.weather || {}) }
  s.soundOn = save.soundOn !== false
  s.stats = { ...s.stats, ...(save.stats || {}) }
  s.nextEventAt = now + randRange(EVENT_GAP) * 1000
  s.lastTick = num(save.lastTick, now)

  if (Array.isArray(save.plots)) {
    for (const sp of save.plots) {
      const p = s.plots[sp?.id]
      if (!p) continue
      p.unlocked = !!sp.unlocked
      p.crop = normalizeCrop(sp.crop, now)
    }
  }
  return s
}

function normalizeCrop(c, now) {
  if (!c || !CROPS[c.id]) return null
  return {
    id: c.id,
    progress: clamp01(num(c.progress, 0)),
    watered: !!c.watered,
    mutation: MUTATIONS[c.mutation] ? c.mutation : null,
    infestation:
      c.infestation && INFEST[c.infestation.type]
        ? { type: c.infestation.type, endsAt: num(c.infestation.endsAt, 0) }
        : null,
    dead: !!c.dead,
    plantedAt: num(c.plantedAt, now),
  }
}

// ------------------------------------------------------------
// The reducer
// ------------------------------------------------------------
export function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD': return hydrate(action.save, action.now ?? Date.now())
    case 'NEW_GAME': return createInitialState(action.now ?? Date.now())
    default: break
  }

  const s = structuredClone(state)   // small state — safe & simple draft
  const now = action.now ?? Date.now()
  const push = (fx) => { s.fx.push({ id: s.fxSeq++, ...fx }) }
  const plot = (id) => s.plots.find((p) => p.id === id)

  switch (action.type) {
    // ------------------------------------------------ Tick / game loop
    case 'TICK': return tick(s, now, push)

    // ------------------------------------------------ Planting
    case 'PLANT': {
      const p = plot(action.plotId)
      const crop = CROPS[action.cropId]
      if (!p || !crop) return state
      if (!p.unlocked) return state
      if (p.crop) {
        push({ kind: 'floater', plotId: p.id, text: 'Already planted!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if ((s.seeds[action.cropId] || 0) <= 0) {
        push({ kind: 'floater', plotId: p.id, text: 'No seeds! 🛒', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      s.seeds[action.cropId] -= 1
      const roll = Math.random()
      const mutation =
        roll < MUTATIONS.golden.chance ? 'golden'
        : roll < MUTATIONS.golden.chance + MUTATIONS.giant.chance ? 'giant'
        : null
      p.crop = { id: action.cropId, progress: 0, watered: false, mutation, infestation: null, dead: false, plantedAt: now }
      s.stats.planted += 1
      push({ kind: 'sfx', name: 'plant' })
      if (mutation) {
        s.stats.mutations += 1
        push({ kind: 'floater', plotId: p.id, text: '✨ special seed…', tone: 'magic' })
        push({ kind: 'sfx', name: 'sparkle' })
      } else {
        push({ kind: 'floater', plotId: p.id, text: `${crop.emoji} planted!`, tone: 'plant' })
      }
      return s
    }

    // ------------------------------------------------ Watering
    case 'WATER': {
      const p = plot(action.plotId)
      if (!p) return state
      const area = s.upgrades.goldenCan ? 3 : 1
      let targets
      if (area === 1) {
        if (!p.crop || p.crop.dead) {
          push({ kind: 'floater', plotId: p.id, text: 'Nothing to water!', tone: 'error' })
          push({ kind: 'sfx', name: 'error' })
          return s
        }
        if (p.crop.progress >= 1) {
          push({ kind: 'floater', plotId: p.id, text: 'Already fully grown!', tone: 'error' })
          push({ kind: 'sfx', name: 'error' })
          return s
        }
        targets = [p]
      } else {
        targets = s.plots.filter((q) => Math.abs(q.row - p.row) <= 1 && Math.abs(q.col - p.col) <= 1)
      }
      let count = 0
      for (const q of targets) {
        if (q.crop && !q.crop.dead && q.crop.progress < 1 && !q.crop.watered) {
          q.crop.watered = true
          count++
        }
      }
      if (count === 0) {
        const anyCrop = targets.some((q) => q.crop && !q.crop.dead)
        const allGrown = targets.every((q) => !q.crop || q.crop.dead || q.crop.progress >= 1)
        const text = !anyCrop ? 'Nothing to water!' : allGrown ? 'Already fully grown!' : 'Already watered 💧'
        push({ kind: 'floater', plotId: p.id, text, tone: 'error' })
        if (!anyCrop || allGrown) push({ kind: 'sfx', name: 'error' })
        return s
      }
      push({ kind: 'sfx', name: 'water' })
      push({ kind: 'floater', plotId: p.id, text: count > 1 ? `💧 Watered ×${count}!` : '💧 Watered! +50%', tone: 'info' })
      return s
    }

    // ------------------------------------------------ Harvesting (hand)
    case 'HARVEST': {
      const p = plot(action.plotId)
      const c = p?.crop
      if (!p || !c) {
        push({ kind: 'floater', plotId: action.plotId, text: 'Empty plot', tone: 'info' })
        return s
      }
      if (c.dead) {
        push({ kind: 'floater', plotId: p.id, text: 'Withered — use the trowel', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if (c.infestation) {
        if (c.infestation.type === 'weeds') {
          c.infestation = null
          addXp(s, 2, push)
          push({ kind: 'sfx', name: 'dig' })
          push({ kind: 'floater', plotId: p.id, text: 'Weeds pulled! +2 XP', tone: 'xp' })
          return s
        }
        push({ kind: 'floater', plotId: p.id, text: 'Use pest spray! 🐛', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if (c.progress < 1) {
        push({ kind: 'floater', plotId: p.id, text: 'Not ready yet!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      const crop = CROPS[c.id]
      if (inventoryUsed(s.inventory) + crop.yield > s.inventoryCap) {
        push({ kind: 'toast', tone: 'error', text: '🎒 Inventory full! Sell your crops at the Barn.' })
        push({ kind: 'floater', plotId: p.id, text: '🎒 Full!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      const sku = makeSku(c.id, c.mutation)
      s.inventory[sku] = (s.inventory[sku] || 0) + crop.yield
      s.stats.harvested += crop.yield
      addXp(s, crop.xp, push)
      push({ kind: 'sfx', name: 'harvest' })
      if (c.mutation) {
        push({ kind: 'floater', plotId: p.id, text: `${MUTATIONS[c.mutation].name.toUpperCase()} ${crop.name}! ×${MUTATIONS[c.mutation].mult}`, tone: 'magic' })
        push({ kind: 'sfx', name: 'sparkle' })
      }
      push({ kind: 'floater', plotId: p.id, text: `+${crop.yield} ${crop.emoji}`, tone: 'harvest', slot: c.mutation ? 2 : 0 })
      push({ kind: 'floater', plotId: p.id, text: `+${crop.xp} XP`, tone: 'xp', slot: c.mutation ? 3 : 1 })
      p.crop = null
      return s
    }

    // ------------------------------------------------ Trowel
    case 'CLEAR': {
      const p = plot(action.plotId)
      if (!p || !p.crop) {
        push({ kind: 'floater', plotId: action.plotId, text: 'Nothing to clear', tone: 'info' })
        return s
      }
      p.crop = null
      push({ kind: 'sfx', name: 'dig' })
      push({ kind: 'floater', plotId: p.id, text: 'Cleared ✨', tone: 'info' })
      return s
    }

    // ------------------------------------------------ Pest spray
    case 'SPRAY': {
      const p = plot(action.plotId)
      const c = p?.crop
      if (!p || !c || c.dead) {
        push({ kind: 'floater', plotId: action.plotId, text: 'Nothing to spray!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if (c.infestation?.type !== 'pests') {
        push({ kind: 'floater', plotId: p.id, text: 'No pests here!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      c.infestation = null
      addXp(s, 2, push)
      push({ kind: 'sfx', name: 'spray' })
      push({ kind: 'floater', plotId: p.id, text: '🐛 Sprayed! +2 XP', tone: 'xp' })
      return s
    }

    // ------------------------------------------------ Fertilizer
    case 'FERTILIZE': {
      const p = plot(action.plotId)
      const c = p?.crop
      if (s.fertilizer <= 0) {
        push({ kind: 'toast', tone: 'error', text: 'Out of fertilizer! Buy more in the shop 🛒' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if (!p || !c || c.dead) {
        push({ kind: 'floater', plotId: action.plotId, text: 'Nothing to boost!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      if (c.progress >= 1) {
        push({ kind: 'floater', plotId: p.id, text: 'Already fully grown!', tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      const boost = s.upgrades.deluxeFert ? FERTILIZER_BOOST_DELUXE : FERTILIZER_BOOST
      c.progress = Math.min(1, c.progress + boost)
      s.fertilizer -= 1
      push({ kind: 'sfx', name: 'sparkle' })
      push({ kind: 'floater', plotId: p.id, text: `⚡ +${Math.round(boost * 100)}% growth!`, tone: 'magic' })
      if (c.progress >= 1) push({ kind: 'sfx', name: 'ready' })
      return s
    }

    // ------------------------------------------------ Plot expansion
    case 'UNLOCK_PLOT': {
      const p = plot(action.plotId)
      if (!p || p.unlocked) return state
      const cost = plotCost(s.plots.filter((q) => q.unlocked).length)
      if (s.coins < cost) {
        push({ kind: 'toast', tone: 'error', text: `Not enough coins — need 🪙${fmt(cost)} to till that plot.` })
        push({ kind: 'floater', plotId: p.id, text: `🪙${fmt(cost)} needed`, tone: 'error' })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      s.coins -= cost
      s.stats.spent += cost
      p.unlocked = true
      push({ kind: 'sfx', name: 'buy' })
      push({ kind: 'floater', plotId: p.id, text: '✨ New plot!', tone: 'magic' })
      return s
    }

    // ------------------------------------------------ Shop: seeds
    case 'BUY_SEEDS': {
      const crop = CROPS[action.cropId]
      const qty = Math.max(1, Math.min(99, action.qty || 1))
      if (!crop) return state
      if (s.level < crop.unlockLevel) {
        push({ kind: 'toast', tone: 'error', text: `${crop.emoji} ${crop.name} unlocks at level ${crop.unlockLevel}.` })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      const cost = crop.seedCost * qty
      if (s.coins < cost) {
        push({ kind: 'toast', tone: 'error', text: `Not enough coins — need 🪙${fmt(cost)}.` })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      s.coins -= cost
      s.stats.spent += cost
      s.seeds[action.cropId] = (s.seeds[action.cropId] || 0) + qty
      push({ kind: 'sfx', name: 'buy' })
      push({ kind: 'toast', tone: 'success', text: `Bought ${qty}× ${crop.emoji} ${crop.name} seed${qty > 1 ? 's' : ''} for 🪙${fmt(cost)}.` })
      return s
    }

    // ------------------------------------------------ Shop: supplies
    case 'BUY_SUPPLY': {
      const item = SUPPLIES[action.key]
      if (!item) return state
      const bulk = !!action.bulk
      const cost = bulk ? item.bulkPrice : item.price
      const qty = bulk ? item.bulkQty : 1
      if (s.coins < cost) {
        push({ kind: 'toast', tone: 'error', text: `Not enough coins — need 🪙${fmt(cost)}.` })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      s.coins -= cost
      s.stats.spent += cost
      s.fertilizer += qty
      push({ kind: 'sfx', name: 'buy' })
      push({ kind: 'toast', tone: 'success', text: `Bought ${qty}× ${item.name} for 🪙${fmt(cost)}.` })
      return s
    }

    // ------------------------------------------------ Shop: upgrades
    case 'BUY_UPGRADE': {
      if (action.id === 'backpack') {
        const nextTier = s.backpackTier + 1
        const tier = BACKPACK_TIERS[nextTier]
        if (!tier) return state
        if (s.coins < tier.cost) {
          push({ kind: 'toast', tone: 'error', text: `Not enough coins — need 🪙${fmt(tier.cost)}.` })
          push({ kind: 'sfx', name: 'error' })
          return s
        }
        s.coins -= tier.cost
        s.stats.spent += tier.cost
        s.backpackTier = nextTier
        s.inventoryCap = tier.cap
        push({ kind: 'sfx', name: 'buy' })
        push({ kind: 'toast', tone: 'success', text: `🎒 Backpack upgraded! Capacity is now ${tier.cap}.` })
        return s
      }
      const up = UPGRADES[action.id]
      if (!up || s.upgrades[action.id]) return state
      if (s.coins < up.cost) {
        push({ kind: 'toast', tone: 'error', text: `Not enough coins — need 🪙${fmt(up.cost)}.` })
        push({ kind: 'sfx', name: 'error' })
        return s
      }
      s.coins -= up.cost
      s.stats.spent += up.cost
      s.upgrades[action.id] = true
      push({ kind: 'sfx', name: 'buy' })
      push({ kind: 'toast', tone: 'success', text: `${up.icon} ${up.name} unlocked!` })
      return s
    }

    // ------------------------------------------------ Barn: selling
    case 'SELL': {
      const have = s.inventory[action.sku] || 0
      if (have <= 0) return state
      const qty = Math.max(1, Math.min(action.qty ?? have, have))
      const { cropId, mutation } = skuParts(action.sku)
      const gain = sellPrice(cropId, mutation) * qty
      s.inventory[action.sku] = have - qty
      if (s.inventory[action.sku] <= 0) delete s.inventory[action.sku]
      s.coins += gain
      s.stats.earned += gain
      push({ kind: 'sfx', name: 'coin' })
      push({ kind: 'toast', tone: 'success', text: `Sold ${qty}× ${CROPS[cropId].emoji}${mutation ? ` ${MUTATIONS[mutation].name}` : ''} for 🪙${fmt(gain)}!` })
      return s
    }

    case 'SELL_ALL': {
      let gain = 0
      let count = 0
      for (const [sku, qty] of Object.entries(s.inventory)) {
        const { cropId, mutation } = skuParts(sku)
        gain += sellPrice(cropId, mutation) * qty
        count += qty
      }
      if (!count) return state
      s.inventory = {}
      s.coins += gain
      s.stats.earned += gain
      push({ kind: 'sfx', name: 'coin' })
      push({ kind: 'toast', tone: 'success', text: `Sold ${count} crops for 🪙${fmt(gain)}!` })
      return s
    }

    // ------------------------------------------------ Misc
    case 'TOGGLE_SOUND': {
      s.soundOn = !s.soundOn
      return s
    }

    case 'PAUSE_EVENTS': {
      // called when the tab is hidden so no unfair infestations spawn unseen
      s.nextEventAt = Math.max(s.nextEventAt, now + 45000)
      return s
    }

    case 'CLEAR_FX': {
      s.fx = []
      return s
    }

    default:
      return state
  }
}

// ------------------------------------------------------------
// Tick — advances growth, infestations, rain & random events.
// A large dt (page reloaded / tab restored) is applied as one
// offline step, which is exactly how offline growth works.
// ------------------------------------------------------------
function tick(s, now, push) {
  const dtMs = Math.min(Math.max(0, now - s.lastTick), OFFLINE_CAP_MS)
  s.lastTick = now
  const dtSec = dtMs / 1000
  const offline = dtMs > 60000
  const raining = now < s.weather.rainUntil

  let finished = 0
  let withered = 0

  for (const p of s.plots) {
    const c = p.crop
    if (!c || c.dead) continue

    if (c.infestation) {
      if (now >= c.infestation.endsAt) {
        c.dead = true
        c.infestation = null
        withered++
        if (!offline) {
          push({ kind: 'toast', tone: 'error', text: `Your ${CROPS[c.id].name} withered away… 🥀 Clear it with the trowel.` })
          push({ kind: 'sfx', name: 'wither' })
        }
      }
      continue // growth is paused while infested
    }

    if (c.progress < 1) {
      const mult = (c.watered || raining) ? WATER_MULT : 1
      c.progress = Math.min(1, c.progress + (dtSec * mult) / CROPS[c.id].growth)
      if (c.progress >= 1) {
        finished++
        if (!offline) push({ kind: 'sfx', name: 'ready' })
      }
    }
  }

  if (offline) {
    // No events fired while away; push the next roll into the future.
    s.nextEventAt = now + randRange(EVENT_GAP) * 1000
    if (finished > 0 || withered > 0) {
      const bits = []
      if (finished) bits.push(`${finished} crop${finished > 1 ? 's' : ''} finished growing`)
      if (withered) bits.push(`${withered} withered`)
      push({ kind: 'toast', tone: 'info', text: `🌙 Welcome back! While you were away (${fmtDur(dtMs)}), ${bits.join(' and ')}.` })
    }
    return s
  }

  if (now >= s.nextEventAt) {
    s.nextEventAt = now + randRange(EVENT_GAP) * 1000
    spawnEvent(s, now, push)
  }
  return s
}

function spawnEvent(s, now, push) {
  if (now < s.weather.rainUntil) return // rain suppresses other events

  const growable = s.plots.filter(
    (p) => p.crop && !p.crop.dead && p.crop.progress < 1 && !p.crop.infestation
  )

  const wantRain = Math.random() < 0.38 || growable.length === 0
  if (wantRain) {
    if (now - s.weather.lastRainAt < RAIN_COOLDOWN) return
    const dur = randRange([RAIN.min, RAIN.max])
    s.weather.rainUntil = now + dur * 1000
    s.weather.lastRainAt = now
    for (const p of s.plots) {
      if (p.crop && !p.crop.dead) p.crop.watered = true
    }
    push({ kind: 'toast', tone: 'info', text: '🌧️ Rain shower! Everything is watered — +50% growth speed!' })
    push({ kind: 'sfx', name: 'rain' })
    return
  }

  const p = growable[Math.floor(Math.random() * growable.length)]
  if (!p) return
  const type = Math.random() < 0.5 ? 'weeds' : 'pests'
  p.crop.infestation = { type, endsAt: now + INFEST[type].deadline * 1000 }
  const inf = INFEST[type]
  push({
    kind: 'toast',
    tone: 'warn',
    text: `${inf.emoji} ${inf.name} are attacking a ${CROPS[p.crop.id].name}! Quickly ${inf.action}!`,
  })
  push({ kind: 'sfx', name: 'alert' })
}

function addXp(s, amount, push) {
  s.xp += amount
  while (s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level)
    s.level += 1
    const reward = levelReward(s.level)
    s.coins += reward
    push({ kind: 'banner', level: s.level, coins: reward })
    push({ kind: 'sfx', name: 'levelup' })
    for (const id of CROP_ORDER) {
      if (CROPS[id].unlockLevel === s.level) {
        push({ kind: 'toast', tone: 'success', text: `${CROPS[id].emoji} ${CROPS[id].name} seeds unlocked in the shop!` })
      }
    }
  }
}
