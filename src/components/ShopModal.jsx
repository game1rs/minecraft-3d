import { useState } from 'react'
import { ShoppingBasket, Lock, CheckCircle2, Zap } from 'lucide-react'
import Modal from './Modal'
import { CROPS, CROP_ORDER, SUPPLIES, UPGRADES, BACKPACK_TIERS, fmt } from '../game/data'

// Shop modal — Seeds tab & Gear tab (supplies + tool upgrades).
export default function ShopModal({ state, dispatch, onClose }) {
  const [tab, setTab] = useState('seeds')

  return (
    <Modal title="Sam's Shop" icon={ShoppingBasket} onClose={onClose} wide>
      <div className="flex gap-2 mb-4">
        {[
          ['seeds', '🌱 Seeds'],
          ['gear', '🧰 Gear & Upgrades'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 font-extrabold text-sm border-2 transition ${
              tab === id
                ? 'bg-emerald-500 border-emerald-600 text-white shadow'
                : 'bg-white border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="flex items-center gap-1 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1 font-extrabold text-amber-800 text-sm tabular-nums">
          🪙 {fmt(state.coins)}
        </span>
      </div>

      {tab === 'seeds' ? (
        <div className="flex flex-col gap-2.5">
          {CROP_ORDER.map((id) => {
            const c = CROPS[id]
            const locked = state.level < c.unlockLevel
            const owned = state.seeds[id] || 0
            return (
              <div
                key={id}
                className={`rounded-2xl border-2 p-2.5 sm:p-3 flex items-center gap-3 ${
                  locked ? 'border-slate-200 bg-slate-100/70' : 'border-amber-200 bg-white shadow-sm'
                }`}
              >
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center text-2xl shrink-0"
                  style={{ background: `${c.color}22`, border: `2px solid ${c.color}55` }}
                >
                  {locked ? <Lock size={17} className="text-slate-400" /> : c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {c.name}
                    {owned > 0 && <span className="ml-1.5 text-[11px] font-bold text-emerald-700">· {owned} owned</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {locked ? `🔒 Unlocks at level ${c.unlockLevel}` : c.blurb}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[9px] sm:text-[10px] font-bold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5">⏱ {c.growth}s</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5">💰 sells {fmt(c.sellPrice)}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5">📦 ×{c.yield} per harvest</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5">⚡ {c.xp} XP</span>
                  </div>
                </div>
                {!locked && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <BuyBtn
                      label="Buy 1"
                      cost={c.seedCost}
                      disabled={state.coins < c.seedCost}
                      onClick={() => dispatch({ type: 'BUY_SEEDS', cropId: id, qty: 1 })}
                    />
                    <BuyBtn
                      label="Buy 10"
                      cost={c.seedCost * 10}
                      disabled={state.coins < c.seedCost * 10}
                      onClick={() => dispatch({ type: 'BUY_SEEDS', cropId: id, qty: 10 })}
                    />
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-[11px] text-slate-400 font-bold text-center pt-1">
            Tip: watered crops grow 50% faster — and 1 in 20 seeds grows up Giant or Golden! ✨
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Supplies */}
          <SectionTitle label="Supplies" />
          {Object.values(SUPPLIES).map((item) => (
            <div key={item.id} className="rounded-2xl border-2 border-amber-200 bg-white p-2.5 sm:p-3 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center text-2xl bg-rose-100 border-2 border-rose-300/60 shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-800 text-sm sm:text-base">
                  {item.name}
                  <span className="ml-1.5 text-[11px] font-bold text-rose-600">· {state.fertilizer} owned</span>
                </div>
                <div className="text-[11px] text-slate-500">{item.blurb}</div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <BuyBtn
                  label="Buy 1"
                  cost={item.price}
                  disabled={state.coins < item.price}
                  onClick={() => dispatch({ type: 'BUY_SUPPLY', key: item.id, bulk: false })}
                />
                <BuyBtn
                  label={`Buy ${item.bulkQty} pack`}
                  cost={item.bulkPrice}
                  disabled={state.coins < item.bulkPrice}
                  onClick={() => dispatch({ type: 'BUY_SUPPLY', key: item.id, bulk: true })}
                />
              </div>
            </div>
          ))}

          {/* Upgrades */}
          <SectionTitle label="Tool Upgrades" />
          {Object.values(UPGRADES).map((up) => {
            const owned = state.upgrades[up.id]
            return (
              <div
                key={up.id}
                className={`rounded-2xl border-2 p-2.5 sm:p-3 flex items-center gap-3 ${
                  owned ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-white shadow-sm'
                }`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center text-2xl bg-sky-100 border-2 border-sky-300/60 shrink-0">
                  {up.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-800 text-sm sm:text-base">{up.name}</div>
                  <div className="text-[11px] text-slate-500">{up.blurb}</div>
                </div>
                {owned ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-extrabold text-xs shrink-0">
                    <CheckCircle2 size={16} /> Owned
                  </span>
                ) : (
                  <BuyBtn
                    label="Upgrade"
                    cost={up.cost}
                    disabled={state.coins < up.cost}
                    onClick={() => dispatch({ type: 'BUY_UPGRADE', id: up.id })}
                  />
                )}
              </div>
            )
          })}

          {/* Backpack */}
          <SectionTitle label="Storage" />
          {(() => {
            const nextTier = BACKPACK_TIERS[state.backpackTier + 1]
            return (
              <div className="rounded-2xl border-2 border-amber-200 bg-white p-2.5 sm:p-3 flex items-center gap-3 shadow-sm">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center text-2xl bg-orange-100 border-2 border-orange-300/60 shrink-0">
                  🎒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-800 text-sm sm:text-base">Backpack</div>
                  <div className="text-[11px] text-slate-500">
                    Current capacity: {state.inventoryCap} crops
                    {nextTier ? ` — next tier holds ${nextTier.cap}.` : ' — fully upgraded!'}
                  </div>
                </div>
                {nextTier ? (
                  <BuyBtn
                    label="Upgrade"
                    cost={nextTier.cost}
                    disabled={state.coins < nextTier.cost}
                    onClick={() => dispatch({ type: 'BUY_UPGRADE', id: 'backpack' })}
                  />
                ) : (
                  <span className="flex items-center gap-1 text-emerald-700 font-extrabold text-xs shrink-0">
                    <CheckCircle2 size={16} /> Max
                  </span>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </Modal>
  )
}

function SectionTitle({ label }) {
  return (
    <div className="flex items-center gap-1.5 text-amber-800/80 font-extrabold text-xs uppercase tracking-wider pt-1">
      <Zap size={12} /> {label}
    </div>
  )
}

function BuyBtn({ label, cost, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-1 text-[11px] sm:text-xs font-extrabold border-2 transition whitespace-nowrap ${
        disabled
          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-emerald-500 border-emerald-600 text-white hover:brightness-110 active:scale-95 shadow'
      }`}
    >
      {label}
      <span className="opacity-90">🪙{fmt(cost)}</span>
    </button>
  )
}
