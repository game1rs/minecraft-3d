import { Warehouse, PackageOpen, TrendingUp } from 'lucide-react'
import Modal from './Modal'
import { CROPS, MUTATIONS, sellPrice, skuParts, fmt, inventoryUsed } from '../game/data'

// Barn modal — inventory list with per-item & sell-all buttons.
export default function BarnModal({ state, dispatch, onClose }) {
  const entries = Object.entries(state.inventory)
    .map(([sku, qty]) => {
      const { cropId, mutation } = skuParts(sku)
      return { sku, qty, cropId, mutation, unit: sellPrice(cropId, mutation) }
    })
    .sort((a, b) => b.unit * b.qty - a.unit * a.qty)

  const totalValue = entries.reduce((sum, e) => sum + e.unit * e.qty, 0)
  const totalCount = inventoryUsed(state.inventory)
  const full = totalCount >= state.inventoryCap

  return (
    <Modal title="Barn — Sell Harvest" icon={Warehouse} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`rounded-full px-3 py-1.5 font-extrabold text-sm border-2 ${
            full
              ? 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse'
              : 'bg-orange-100 border-orange-300 text-orange-800'
          }`}
          title="Backpack capacity"
        >
          🎒 {totalCount}/{state.inventoryCap}
        </span>
        <span className="rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1.5 font-extrabold text-sm text-amber-800">
          Stock value: 🪙{fmt(totalValue)}
        </span>
        <div className="flex-1" />
        <span className="rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1.5 font-extrabold text-sm text-amber-800 tabular-nums">
          🪙 {fmt(state.coins)}
        </span>
        {totalCount > 0 && (
          <button
            onClick={() => dispatch({ type: 'SELL_ALL' })}
            className="rounded-xl px-4 py-2 font-extrabold text-sm text-white bg-gradient-to-b from-amber-500 to-amber-600 border-2 border-amber-700/40 hover:brightness-110 active:scale-95 shadow transition"
          >
            💰 Sell Everything (+🪙{fmt(totalValue)})
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <PackageOpen size={44} className="text-amber-300" />
          <p className="font-extrabold text-slate-500">Your barn is empty!</p>
          <p className="text-xs text-slate-400 font-bold -mt-2">
            Harvest ripe crops with the Hand tool, then bring them here to sell.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {entries.map((e) => {
            const c = CROPS[e.cropId]
            const mut = e.mutation ? MUTATIONS[e.mutation] : null
            return (
              <div
                key={e.sku}
                className={`rounded-2xl border-2 p-2.5 flex items-center gap-3 shadow-sm ${
                  mut ? 'border-fuchsia-200 bg-gradient-to-br from-white to-fuchsia-50' : 'border-amber-200 bg-white'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center text-2xl shrink-0"
                  style={{ background: `${c.color}22`, border: `2px solid ${c.color}55` }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 flex-wrap">
                    {mut ? `${mut.name} ` : ''}{c.name}
                    {mut && (
                      <span className={`text-[9px] rounded-full px-1.5 py-px font-black ${mut.badge}`}>
                        ×{mut.mult}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">
                    ×{e.qty} in stock · 🪙{fmt(e.unit)} each
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SELL', sku: e.sku })}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold text-white bg-emerald-500 border-2 border-emerald-600 hover:brightness-110 active:scale-95 shadow transition whitespace-nowrap"
                >
                  Sell 🪙{fmt(e.unit * e.qty)}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Lifetime stats */}
      <div className="mt-5 rounded-2xl bg-white/70 border-2 border-amber-200 p-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1.5 text-amber-800 font-extrabold">
          <TrendingUp size={14} /> Lifetime stats
        </span>
        <span>🌱 Planted: {fmt(state.stats.planted)}</span>
        <span>🧺 Harvested: {fmt(state.stats.harvested)}</span>
        <span>✨ Mutations: {fmt(state.stats.mutations)}</span>
        <span>💰 Earned: 🪙{fmt(state.stats.earned)}</span>
        <span>🧾 Spent: 🪙{fmt(state.stats.spent)}</span>
      </div>
    </Modal>
  )
}
