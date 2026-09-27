import { useEffect, useRef, useState } from 'react'
import { Coins, Star, Backpack, Volume2, VolumeX, CircleHelp, CloudRain } from 'lucide-react'
import { TOOLS, CROPS, xpToNext, fmt, inventoryUsed } from '../game/data'

// Top HUD: coins, level/XP, inventory capacity, active tool, sound & help.
export default function Hud({ state, tool, selectedSeed, rainOn, onToggleSound, onHelp, onOpenBarn }) {
  const used = inventoryUsed(state.inventory)
  const full = used >= state.inventoryCap
  const need = xpToNext(state.level)

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b-2 border-white/60 shadow-sm">
      <div className="mx-auto max-w-6xl px-2 sm:px-4 py-2 flex flex-wrap items-center gap-1.5 sm:gap-3">
        <div className="font-extrabold text-base sm:text-xl text-emerald-800 flex items-center gap-1.5 mr-1 whitespace-nowrap">
          <span className="text-2xl fx-sway inline-block">🌱</span>
          <span className="hidden sm:inline">Grow a Garden</span>
        </div>

        <CoinPill coins={state.coins} />

        <div className="flex items-center gap-2 rounded-full bg-violet-100 border-2 border-violet-300 px-3 py-1 shadow-sm">
          <Star size={15} className="text-violet-600 fill-violet-500 shrink-0" />
          <div className="leading-tight">
            <div className="text-[11px] font-extrabold text-violet-900">
              Level {state.level}
              <span className="ml-1.5 font-bold text-violet-500">{fmt(state.xp)}/{fmt(need)} XP</span>
            </div>
            <div className="w-20 sm:w-28 h-1.5 rounded-full bg-violet-200 overflow-hidden mt-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500 transition-[width] duration-300"
                style={{ width: `${Math.min(100, (state.xp / need) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onOpenBarn}
          title="Open inventory / barn"
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-extrabold text-sm border-2 shadow-sm transition hover:brightness-105 ${
            full
              ? 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse'
              : 'bg-orange-100 border-orange-300 text-orange-800'
          }`}
        >
          <Backpack size={15} />
          {used}/{state.inventoryCap}
        </button>

        <div className="flex-1" />

        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/80 rounded-full px-3 py-1.5 border-2 border-slate-200 shadow-sm">
          {tool === 'seed' ? `${CROPS[selectedSeed].emoji} ${CROPS[selectedSeed].name} seeds` : `${TOOLS[tool].name} selected`}
        </span>

        <button
          onClick={onToggleSound}
          title={state.soundOn ? 'Mute sounds (M)' : 'Unmute sounds (M)'}
          className="grid place-items-center w-9 h-9 rounded-full bg-white/80 border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition"
        >
          {state.soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button
          onClick={onHelp}
          title="How to play (H)"
          className="grid place-items-center w-9 h-9 rounded-full bg-white/80 border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition"
        >
          <CircleHelp size={17} />
        </button>
      </div>

      {rainOn && (
        <div className="bg-sky-500/95 text-white text-center text-xs sm:text-sm font-extrabold py-1 px-2 flex items-center justify-center gap-2">
          <CloudRain size={15} className="fx-bob" />
          Rain shower! All crops watered — +50% growth speed
        </div>
      )}
    </header>
  )
}

function CoinPill({ coins }) {
  const [pulse, setPulse] = useState(0)
  const prev = useRef(coins)
  useEffect(() => {
    if (coins !== prev.current) {
      prev.current = coins
      setPulse((p) => p + 1)
    }
  }, [coins])
  return (
    <div
      key={pulse}
      className="fx-coin flex items-center gap-1.5 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1.5 font-extrabold text-amber-800 shadow-sm tabular-nums"
      title="Coins"
    >
      <Coins size={15} className="text-amber-500 fill-amber-400" />
      {fmt(coins)}
    </div>
  )
}
