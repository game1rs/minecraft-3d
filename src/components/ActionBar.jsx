import { Hand, Droplets, Shovel, SprayCan, Sparkles, ShoppingBasket, Warehouse } from 'lucide-react'
import { TOOLS, TOOL_IDS, CROPS, CROP_ORDER, inventoryUsed } from '../game/data'

const TOOL_ICONS = { hand: Hand, water: Droplets, trowel: Shovel, spray: SprayCan, fertilizer: Sparkles }

// Bottom action bar: tools (left), seed selector (middle), shop & barn (right).
export default function ActionBar({ state, tool, setTool, selectedSeed, setSelectedSeed, onOpenShop, onOpenBarn }) {
  const used = inventoryUsed(state.inventory)
  const full = used >= state.inventoryCap
  const invCount = used

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(97vw,820px)] px-1">
      <div className="flex items-stretch justify-center gap-1 sm:gap-2 flex-wrap rounded-3xl border-2 border-white/70 bg-white/85 backdrop-blur-md p-1.5 sm:p-2 shadow-2xl">
        {/* ---- Tools ---- */}
        {TOOL_IDS.map((id) => {
          const t = TOOLS[id]
          const Icon = TOOL_ICONS[id]
          const active = tool === id
          return (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={`${t.name} — ${t.desc} (key ${t.hotkey})`}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 sm:px-3.5 py-1.5 font-extrabold border-2 transition-all ${
                active
                  ? 'border-transparent text-white scale-105 shadow-lg'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
              style={active ? { background: t.color, boxShadow: `0 6px 18px ${t.color}66` } : undefined}
            >
              <Icon size={19} />
              <span className="text-[8px] sm:text-[10px] leading-none">{t.label}</span>
              <span className="absolute -top-1 -right-1 text-[8px] font-black bg-slate-700 text-white rounded-full w-3.5 h-3.5 grid place-items-center shadow">
                {t.hotkey}
              </span>
              {id === 'fertilizer' && (
                <span className="absolute -top-1.5 -left-1.5 text-[9px] font-black bg-rose-500 text-white rounded-full min-w-4 h-4 px-1 grid place-items-center shadow">
                  {state.fertilizer}
                </span>
              )}
            </button>
          )
        })}

        <div className="w-px self-stretch bg-slate-300/80 mx-0.5 sm:mx-1.5 rounded-full" />

        {/* ---- Seeds ---- */}
        {CROP_ORDER.map((id) => {
          const c = CROPS[id]
          const locked = state.level < c.unlockLevel
          const active = tool === 'seed' && selectedSeed === id
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => {
                setSelectedSeed(id)
                setTool('seed')
              }}
              title={
                locked
                  ? `${c.name} — unlocks at level ${c.unlockLevel}`
                  : `${c.name} seeds (×${state.seeds[id] || 0}) — plant on empty soil`
              }
              className={`relative flex flex-col items-center justify-center rounded-2xl px-2 sm:px-2.5 py-1.5 border-2 font-extrabold transition-all ${
                locked
                  ? 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
                  : active
                  ? 'border-emerald-500 bg-emerald-100 scale-105 shadow-lg text-emerald-800'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg sm:text-xl leading-none">{locked ? '🔒' : c.emoji}</span>
              <span className="text-[8px] sm:text-[10px] leading-none mt-0.5 tabular-nums">
                {locked ? `Lv ${c.unlockLevel}` : `×${state.seeds[id] || 0}`}
              </span>
            </button>
          )
        })}

        <div className="w-px self-stretch bg-slate-300/80 mx-0.5 sm:mx-1.5 rounded-full" />

        {/* ---- Shop & Barn ---- */}
        <button
          onClick={onOpenShop}
          title="Shop — buy seeds, supplies & upgrades (S)"
          className="flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 sm:px-3.5 py-1.5 font-extrabold text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:brightness-110 border-2 border-emerald-700/40 shadow-md transition"
        >
          <ShoppingBasket size={19} />
          <span className="text-[8px] sm:text-[10px] leading-none">Shop</span>
        </button>
        <button
          onClick={onOpenBarn}
          title="Barn — sell your harvest (B)"
          className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 sm:px-3.5 py-1.5 font-extrabold text-white border-2 shadow-md transition hover:brightness-110 ${
            full
              ? 'bg-gradient-to-b from-rose-500 to-rose-600 border-rose-700/40 animate-pulse'
              : 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-700/40'
          }`}
        >
          <Warehouse size={19} />
          <span className="text-[8px] sm:text-[10px] leading-none">Barn</span>
          {invCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-slate-800 text-white rounded-full min-w-4 h-4 px-1 grid place-items-center shadow">
              {invCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
