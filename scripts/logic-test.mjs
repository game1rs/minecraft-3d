// Throwaway headless test of the game reducer logic (run with node).
import assert from 'node:assert'
import { gameReducer, createInitialState } from '../src/game/reducer.js'

const D = (ms) => ({ type: 'TICK', now: ms })
let t = 1000
let s = createInitialState(t)

// --- basic shape
assert.equal(s.plots.length, 25)
assert.equal(s.plots.filter((p) => p.unlocked).length, 4, 'starts with 4 plots')
assert.equal(s.seeds.carrot, 3)
assert.equal(s.coins, 50)

// --- plant a carrot on an unlocked plot
const plot = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot.id, cropId: 'carrot', now: t })
assert.ok(s.plots.find((p) => p.id === plot.id).crop, 'crop planted')
assert.equal(s.seeds.carrot, 2)

// --- growth: 3 seconds unwatered = 60%
t += 3000
s = gameReducer(s, D(t))
assert.ok(Math.abs(s.plots.find((p) => p.id === plot.id).crop.progress - 0.6) < 0.001, `progress ~60%, got ${s.plots.find((p) => p.id === plot.id).crop.progress}`)

// --- water it: 1.5x speed, remaining 40% takes 4s/1.5
s = gameReducer(s, { type: 'WATER', plotId: plot.id, now: t })
assert.equal(s.plots.find((p) => p.id === plot.id).crop.watered, true)
t += 3000
s = gameReducer(s, D(t))
const p1 = s.plots.find((p) => p.id === plot.id)
assert.ok(Math.abs(p1.crop.progress - 1) < 0.001, `watered carrot finished, got ${p1.crop.progress}`)

// --- harvest: blocked if inventory cap is 0? no — cap 20, ok. yield 1
const invBefore = Object.values(s.inventory).reduce((a, b) => a + b, 0)
s = gameReducer(s, { type: 'HARVEST', plotId: plot.id, now: t })
const invAfter = Object.values(s.inventory).reduce((a, b) => a + b, 0)
assert.equal(invAfter, invBefore + 1, 'harvested 1 carrot')
assert.equal(s.xp, 3, 'gained 3 xp')
assert.equal(s.plots.find((p) => p.id === plot.id).crop, null, 'plot empty again')

// --- sell
s = gameReducer(s, { type: 'SELL', sku: 'carrot:normal' })
assert.equal(s.coins, 50 + 20, 'sold carrot for 20')
assert.deepEqual(s.inventory, {})

// --- shop: insufficient funds rejected, affordable purchase works
s = gameReducer(s, { type: 'BUY_SEEDS', cropId: 'tomato', qty: 10 })
assert.equal(s.seeds.tomato, 0, 'cannot afford 10 tomato seeds with 70 coins')
assert.equal(s.coins, 70, 'no coins spent on failed purchase')
s = gameReducer(s, { type: 'BUY_SEEDS', cropId: 'tomato', qty: 1 })
assert.equal(s.seeds.tomato, 1, 'bought 1 tomato seed')
assert.equal(s.coins, 45, 'spent 25 coins')

// give ourselves coins through golden carrot sale to test mutation pricing
s.inventory['carrot:golden'] = 2
s = gameReducer(s, { type: 'SELL', sku: 'carrot:golden' })
assert.equal(s.coins, 45 + 2 * 100, 'golden carrots sell 100 each (20*5)')

// --- plot unlock: cost check (5th plot = 75)
const locked = s.plots.find((p) => !p.unlocked)
const unlockCost = 75
s.coins = 500
s = gameReducer(s, { type: 'UNLOCK_PLOT', plotId: locked.id, now: t })
assert.equal(s.plots.find((p) => p.id === locked.id).unlocked, true)
assert.equal(s.coins, 500 - unlockCost, 'paid 75 for 5th plot')

// --- infestation pauses growth; weeds pulled by hand; pests need spray
s = createInitialState(t)
const plot2 = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot2.id, cropId: 'carrot', now: t })
s.plots.find((p) => p.id === plot2.id).crop.infestation = { type: 'weeds', endsAt: t + 30000 }
t += 5000
s = gameReducer(s, D(t))
assert.ok(s.plots.find((p) => p.id === plot2.id).crop.progress < 0.01, 'growth paused while infested')
s = gameReducer(s, { type: 'HARVEST', plotId: plot2.id, now: t }) // hand pulls weeds
assert.equal(s.plots.find((p) => p.id === plot2.id).crop.infestation, null, 'weeds pulled')
t += 5000
s = gameReducer(s, D(t))
assert.ok(s.plots.find((p) => p.id === plot2.id).crop.progress > 0.9, 'grew after clearing')

// pests: spray works, hand refuses
s = createInitialState(t)
const plot3 = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot3.id, cropId: 'carrot', now: t })
s.plots.find((p) => p.id === plot3.id).crop.infestation = { type: 'pests', endsAt: t + 25000 }
s = gameReducer(s, { type: 'HARVEST', plotId: plot3.id, now: t }) // should NOT clear
assert.ok(s.plots.find((p) => p.id === plot3.id).crop.infestation, 'hand does not clear pests')
s = gameReducer(s, { type: 'SPRAY', plotId: plot3.id, now: t })
assert.equal(s.plots.find((p) => p.id === plot3.id).crop.infestation, null, 'spray clears pests')

// --- fertilizer instant boost
s = createInitialState(t)
const plot4 = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot4.id, cropId: 'carrot', now: t })
s = gameReducer(s, { type: 'FERTILIZE', plotId: plot4.id, now: t })
assert.ok(Math.abs(s.plots.find((p) => p.id === plot4.id).crop.progress - 0.3) < 0.001, 'fertilizer +30%')
assert.equal(s.fertilizer, 0, 'fertilizer consumed')

// --- golden watering can 3x3
s = createInitialState(t)
s.upgrades.goldenCan = true
const center = s.plots.find((p) => p.row === 1 && p.col === 1)
for (const p of s.plots.filter((q) => q.unlocked && q.id !== center.id)) {
  s = gameReducer(s, { type: 'PLANT', plotId: p.id, cropId: 'carrot', now: t })
}
s = gameReducer(s, { type: 'WATER', plotId: center.id, now: t })
const wateredCount = s.plots.filter((p) => p.crop?.watered).length
assert.equal(wateredCount, 3, `golden can waters 3x3 from empty center → 3 neighbors, got ${wateredCount}`)

// --- offline growth: big dt
t += 3600 * 1000 // 1 hour away
s = gameReducer(s, D(t))
assert.equal(s.plots.filter((p) => p.crop && p.crop.progress >= 1).length, 3, 'all crops finished while offline')
assert.ok(s.fx.some((f) => f.kind === 'toast' && f.text.includes('Welcome back')), 'welcome-back toast emitted')

// --- withering from infestation deadline
s = createInitialState(t)
const plot5 = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot5.id, cropId: 'carrot', now: t })
s.plots.find((p) => p.id === plot5.id).crop.infestation = { type: 'pests', endsAt: t + 25000 }
t += 26000
s = gameReducer(s, D(t))
assert.equal(s.plots.find((p) => p.id === plot5.id).crop.dead, true, 'crop withered')
// clear with trowel
s = gameReducer(s, { type: 'CLEAR', plotId: plot5.id, now: t })
assert.equal(s.plots.find((p) => p.id === plot5.id).crop, null, 'trowel clears withered crop')

// --- inventory full blocks harvest
s = createInitialState(t)
s.inventoryCap = 1
s.inventory['tomato:normal'] = 1
const plot6 = s.plots.find((p) => p.unlocked)
s = gameReducer(s, { type: 'PLANT', plotId: plot6.id, cropId: 'carrot', now: t })
t += 6000
s = gameReducer(s, D(t))
s = gameReducer(s, { type: 'HARVEST', plotId: plot6.id, now: t })
assert.ok(s.plots.find((p) => p.id === plot6.id).crop, 'harvest blocked when inventory full')
assert.ok(s.fx.some((f) => f.kind === 'toast' && f.text.includes('Inventory full')), 'inventory-full toast')

// --- save/hydrate round trip
s = createInitialState(t)
s.coins = 777
s = gameReducer(s, { type: 'PLANT', plotId: s.plots.find((p) => p.unlocked).id, cropId: 'carrot', now: t })
const rehydrated = gameReducer(s, { type: 'LOAD', save: JSON.parse(JSON.stringify({ ...s, fx: [] })) })
assert.equal(rehydrated.coins, 777)
assert.equal(rehydrated.plots.find((p) => p.unlocked).crop.id, 'carrot')

console.log('✅ All reducer logic tests passed!')
