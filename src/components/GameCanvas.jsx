// ============================================================
// 🖥️ GameCanvas — the 3D viewport wrapper: crosshair (point &
// place), aim info panel, "click to play" overlay, on-screen
// touch controls and the controls hint chip.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import Scene from '../three/Scene'
import { CROPS, TOOLS, MUTATIONS, INFEST, WATER_MULT, plotCost, fmt } from '../game/data'

const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export default function GameCanvas({
  state,
  tool,
  selectedSeed,
  onPlotClick,
  floaters,
  rainOn,
  playing,
  setPlaying,
  modalOpen,
}) {
  const wrapRef = useRef(null)
  const [aimedId, setAimedId] = useState(null)
  const [mode, setMode] = useState(() => (isTouchDevice() ? 'touch' : 'lock'))
  const touchInput = useRef({ x: 0, y: 0, jump: false })
  const everLocked = useRef(false)

  const aimedPlot = state.plots.find((p) => p.id === aimedId) || null

  const onAction = useCallback(() => {
    if (aimedPlot) onPlotClick(aimedPlot)
  }, [aimedPlot, onPlotClick])

  const enterGame = useCallback(() => {
    if (mode !== 'lock') {
      setPlaying(true)
      return
    }
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas?.requestPointerLock) {
      setMode('drag')
      setPlaying(true)
      return
    }
    try {
      const p = canvas.requestPointerLock()
      if (p && typeof p.catch === 'function') {
        // transient rejections (e.g. too soon after ESC) are retried by clicking again;
        // only fall back if pointer lock has never worked in this environment
        p.catch(() => {
          if (!everLocked.current) {
            setMode('drag')
            setPlaying(true)
          }
        })
      }
    } catch {
      if (!everLocked.current) {
        setMode('drag')
        setPlaying(true)
      }
    }
  }, [mode, setPlaying])

  // pointer lock unavailable (e.g. embedded preview) → drag-look fallback
  useEffect(() => {
    const onErr = () => {
      if (mode === 'lock' && !everLocked.current) {
        setMode('drag')
        setPlaying(true)
      }
    }
    document.addEventListener('pointerlockerror', onErr)
    return () => document.removeEventListener('pointerlockerror', onErr)
  }, [mode, setPlaying])

  const onLockStateChange = useCallback(
    (locked) => {
      if (mode !== 'lock') return
      if (locked) everLocked.current = true
      setPlaying(locked)
    },
    [mode, setPlaying]
  )

  return (
    <div ref={wrapRef} className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}>
      <Scene
        state={state}
        tool={tool}
        aimedId={aimedId}
        setAimedId={setAimedId}
        floaters={floaters}
        rainOn={rainOn}
        playerProps={{
          mode,
          active: playing && !modalOpen,
          onAction,
          onLockStateChange,
          soundOn: state.soundOn,
          touchInput,
        }}
      />

      <Crosshair aimed={!!aimedPlot} tool={tool} />
      <AimInfo plot={aimedPlot} state={state} tool={tool} selectedSeed={selectedSeed} />

      {playing && !modalOpen && <HintChip mode={mode} />}

      {!playing && !modalOpen && mode !== 'touch' && (
        <ClickToPlay onClick={enterGame} state={state} />
      )}

      {mode === 'touch' && playing && !modalOpen && (
        <TouchControls touchInput={touchInput} onAction={onAction} tool={tool} selectedSeed={selectedSeed} />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// 🎯 Crosshair — changes color when a plot is in reach
// ------------------------------------------------------------
function Crosshair({ aimed, tool }) {
  const color = aimed ? (tool === 'seed' ? '#4ade80' : TOOLS[tool]?.color || '#fff') : 'rgba(255,255,255,0.85)'
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <div className={`relative w-9 h-9 transition-transform duration-150 ${aimed ? 'scale-110' : 'scale-90'}`}>
        <span
          className="absolute rounded-full"
          style={{
            left: '50%', top: '50%', width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5,
            background: color, boxShadow: '0 0 6px rgba(0,0,0,0.7)',
          }}
        />
        {[0, 90, 180, 270].map((deg) => (
          <span
            key={deg}
            className="absolute rounded-full"
            style={{
              left: '50%', top: '50%', width: 2.5, height: 9, marginLeft: -1.25, marginTop: -4.5,
              background: color, boxShadow: '0 0 4px rgba(0,0,0,0.55)',
              transform: `rotate(${deg}deg) translateY(-11px)`,
              transformOrigin: 'center',
              transition: 'background 150ms',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 💬 Aim info — what the crosshair is pointing at
// ------------------------------------------------------------
function AimInfo({ plot, state, tool, selectedSeed }) {
  const info = aimInfo(plot, state, tool, selectedSeed)
  if (!info) return null
  const pct = plot?.crop && !plot.crop.dead ? Math.min(100, Math.floor(plot.crop.progress * 100)) : 0
  const showBar = plot?.crop && !plot.crop.dead && plot.crop.progress < 1
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 mt-9 flex flex-col items-center gap-1 w-64">
      <div
        className={`rounded-xl px-3 py-1 text-center shadow-lg border-2 ${
          info.danger
            ? 'bg-rose-600/90 border-rose-400 text-white'
            : info.good
            ? 'bg-emerald-600/90 border-emerald-400 text-white'
            : 'bg-slate-900/70 border-white/20 text-white'
        }`}
      >
        <div className="text-xs font-extrabold leading-tight">{info.title}</div>
        <div className="text-[10px] font-bold opacity-90 leading-tight">{info.sub}</div>
      </div>
      {showBar && (
        <div className="h-1.5 w-36 rounded-full bg-black/50 overflow-hidden border border-white/20">
          <div
            className={`h-full rounded-full ${plot.crop.infestation ? 'bg-rose-400' : 'bg-gradient-to-r from-lime-400 to-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function aimInfo(plot, state, tool, selectedSeed) {
  if (!plot) return null
  if (!plot.unlocked) {
    const cost = plotCost(state.plots.filter((p) => p.unlocked).length)
    return { title: '🔒 Untilled plot', sub: `Click to till for 🪙${fmt(cost)}` }
  }
  const c = plot.crop
  if (!c) {
    if (tool === 'seed') {
      const s = CROPS[selectedSeed]
      return {
        title: 'Empty soil',
        sub: `Click to plant ${s.emoji} ${s.name} (×${state.seeds[selectedSeed] || 0} seeds)`,
      }
    }
    return { title: 'Empty soil', sub: 'Select a seed (Q/E) to plant here' }
  }
  const crop = CROPS[c.id]
  if (c.dead) return { title: `🥀 Withered ${crop.name}`, sub: 'Clear it with the Trowel (3)' }

  if (c.infestation) {
    const inf = INFEST[c.infestation.type]
    const left = Math.max(0, Math.ceil((c.infestation.endsAt - Date.now()) / 1000))
    return {
      title: `${inf.emoji} ${inf.name} attacking!`,
      sub:
        c.infestation.type === 'weeds'
          ? `${left}s — pull with Hand (1) or Trowel (3)!`
          : `${left}s — spray with Pest Spray (4)!`,
      danger: true,
    }
  }

  const watered = c.watered
  if (c.progress >= 1) {
    const mName = c.mutation ? `${MUTATIONS[c.mutation].name} ` : ''
    if (tool === 'hand')
      return { title: `${crop.emoji} ${mName}${crop.name} — ripe!`, sub: 'Click to harvest 🖐️', good: true }
    return { title: `${crop.emoji} ${mName}${crop.name} — ready!`, sub: 'Switch to Hand (1) to harvest', good: true }
  }

  const remain = Math.ceil(((1 - c.progress) * crop.growth) / (watered ? WATER_MULT : 1))
  return {
    title: `${crop.emoji} ${crop.name} · ${Math.floor(c.progress * 100)}%`,
    sub: `~${remain}s left${watered ? ' · 💧 watered (+50%)' : ' · water me! (2)'}`,
  }
}

// ------------------------------------------------------------
// ▶️ Click-to-play overlay (desktop)
// ------------------------------------------------------------
function ClickToPlay({ onClick, state }) {
  return (
    <div
      onClick={onClick}
      className="absolute inset-0 z-30 grid place-items-center bg-slate-900/45 backdrop-blur-[3px] cursor-pointer"
    >
      <div className="fx-pop m-4 rounded-3xl bg-white/95 border-4 border-emerald-200 shadow-2xl px-7 sm:px-10 py-6 text-center max-w-md">
        <div className="text-4xl mb-1 fx-sway inline-block">🌱</div>
        <h2 className="text-2xl font-extrabold text-emerald-800">Grow a Garden</h2>
        <p className="text-xs font-extrabold text-emerald-600 mb-4 tracking-widest">3D EDITION</p>
        <div className="text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-left mb-4">
          <span>🖱️ <b>Mouse</b> — look around</span>
          <span>⌨️ <b>WASD</b> — walk</span>
          <span>👉 <b>Click</b> — use tool / plant</span>
          <span>🔢 <b>1–5</b> — tools</span>
          <span>🥕 <b>Q / E</b> — cycle seeds</span>
          <span>🦘 <b>Space</b> — jump · <b>Shift</b> run</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs font-extrabold text-slate-500 mb-4">
          <span>⭐ Level {state.level}</span>
          <span>🪙 {fmt(state.coins)}</span>
          <span>🌾 {state.plots.filter((p) => p.unlocked).length}/{state.plots.length} plots</span>
        </div>
        <button className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 border-2 border-emerald-700/40 text-white font-extrabold text-lg py-2.5 shadow-lg hover:brightness-110 active:scale-95 transition">
          ▶ Click to Play
        </button>
        <p className="text-[10px] font-bold text-slate-400 mt-2">Press ESC anytime to free your cursor</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 💡 Controls hint chip
// ------------------------------------------------------------
function HintChip({ mode }) {
  return (
    <div className="pointer-events-none absolute bottom-[92px] sm:bottom-[96px] left-1/2 -translate-x-1/2 z-20 bg-black/45 text-white/90 text-[10px] sm:text-[11px] font-extrabold rounded-full px-3 py-1 shadow whitespace-nowrap">
      {mode === 'lock'
        ? 'WASD move · mouse look · click act · 1–5 tools · Q/E seeds · Space jump · ESC menu'
        : mode === 'drag'
        ? 'WASD move · drag to look · click act · 1–5 tools · Q/E seeds · Space jump'
        : 'Left stick move · drag to look · ACT to use tool'}
    </div>
  )
}

// ------------------------------------------------------------
// 📱 Touch controls (joystick + action/jump buttons)
// ------------------------------------------------------------
function TouchControls({ touchInput, onAction, tool, selectedSeed }) {
  const label =
    tool === 'seed' ? `${CROPS[selectedSeed].emoji} PLANT` : TOOLS[tool]?.label?.toUpperCase() || 'ACT'
  return (
    <>
      <Joystick touchInput={touchInput} />
      <button
        onTouchStart={(e) => {
          e.preventDefault()
          onAction()
        }}
        className="absolute bottom-32 right-5 z-30 w-24 h-24 rounded-full bg-emerald-600/85 border-4 border-white/70 text-white font-extrabold text-xs shadow-xl active:scale-95 transition touch-none select-none"
      >
        {label}
      </button>
      <button
        onTouchStart={(e) => {
          e.preventDefault()
          touchInput.current.jump = true
        }}
        className="absolute bottom-[10.5rem] right-7 z-30 w-16 h-16 rounded-full bg-sky-600/85 border-4 border-white/70 text-white text-2xl shadow-xl active:scale-95 transition touch-none select-none"
      >
        ⤒
      </button>
    </>
  )
}

function Joystick({ touchInput }) {
  const base = useRef(null)
  const knob = useRef(null)
  const touchId = useRef(null)

  const update = (t) => {
    const r = base.current.getBoundingClientRect()
    let dx = t.clientX - (r.left + r.width / 2)
    let dy = t.clientY - (r.top + r.height / 2)
    const len = Math.hypot(dx, dy)
    const max = r.width / 2 - 16
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    touchInput.current.x = dx / max
    touchInput.current.y = -dy / max
  }

  return (
    <div
      ref={base}
      onTouchStart={(e) => {
        e.preventDefault()
        const t = e.changedTouches[0]
        touchId.current = t.identifier
        update(t)
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        for (const t of e.changedTouches) if (t.identifier === touchId.current) update(t)
      }}
      onTouchEnd={(e) => {
        for (const t of e.changedTouches)
          if (t.identifier === touchId.current) {
            touchId.current = null
            knob.current.style.transform = 'translate(0px, 0px)'
            touchInput.current.x = 0
            touchInput.current.y = 0
          }
      }}
      className="absolute bottom-32 left-5 z-30 w-28 h-28 rounded-full bg-white/25 border-2 border-white/50 backdrop-blur-sm touch-none select-none"
    >
      <div
        ref={knob}
        className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-white/85 shadow-lg"
      />
    </div>
  )
}
