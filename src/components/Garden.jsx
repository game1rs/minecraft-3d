import { Lock } from 'lucide-react'
import { CROPS, MUTATIONS, INFEST, WATER_MULT, plotCost, fmt } from '../game/data'

// The garden: a fenced 5×5 grid of soil plots on grass.
export default function Garden({ state, onPlotClick, floaters, rainOn }) {
  const unlockedCount = state.plots.filter((p) => p.unlocked).length
  const nextCost = plotCost(unlockedCount)

  return (
    <div className="w-full max-w-[620px] mx-auto select-none">
      <div className="flex items-end justify-between px-2 pb-1.5">
        <h2 className="font-extrabold text-emerald-900/80 text-sm sm:text-base drop-shadow-sm">
          🌾 Your Garden
        </h2>
        <span className="text-[11px] sm:text-xs font-extrabold text-emerald-900/60">
          {unlockedCount}/{state.plots.length} plots tilled
        </span>
      </div>

      <div className="rounded-[2rem] p-1.5 sm:p-3 bg-gradient-to-b from-[#a9743f] to-[#7a4a26] shadow-[0_18px_50px_rgba(0,0,0,0.28)] border border-amber-900/30">
        <div className="grass-bg relative rounded-[1.6rem] p-2 sm:p-4 overflow-hidden">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {state.plots.map((p) => (
              <Plot key={p.id} plot={p} onPlotClick={onPlotClick} floaters={floaters} lockCost={nextCost} rainOn={rainOn} />
            ))}
          </div>
          {rainOn && (
            <div className="pointer-events-none absolute inset-0 z-20">
              <div className="absolute inset-0 bg-sky-900/10" />
              <div className="absolute inset-0 rain-layer opacity-70" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// A single soil plot
// ------------------------------------------------------------
function Plot({ plot, onPlotClick, floaters, lockCost, rainOn }) {
  const crop = plot.crop
  const def = crop ? CROPS[crop.id] : null
  const dead = !!crop?.dead
  const ready = !!crop && !dead && crop.progress >= 1
  const growing = !!crop && !dead && !ready
  const inf = crop?.infestation
  const now = Date.now()
  const infLeftS = inf ? Math.max(0, Math.ceil((inf.endsAt - now) / 1000)) : 0
  const watered = (!!crop?.watered && !dead) || (rainOn && !!crop && !dead)
  const remain = growing
    ? Math.ceil(((1 - crop.progress) * def.growth) / (watered ? WATER_MULT : 1))
    : 0
  const myFloaters = floaters.filter((f) => f.plotId === plot.id)

  // ---------- Locked plots ----------
  if (!plot.unlocked) {
    return (
      <button
        onClick={() => onPlotClick(plot)}
        title={`Till this plot for ${fmt(lockCost)} coins`}
        className="group relative aspect-square rounded-2xl border-2 border-dashed border-emerald-950/40 bg-emerald-900/25 hover:bg-emerald-900/45 transition grid place-items-center"
      >
        <Lock size={15} className="text-emerald-950/60 group-hover:scale-110 transition" />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-extrabold text-amber-100 bg-emerald-950/70 rounded-full px-1.5 py-px whitespace-nowrap shadow">
          🪙{fmt(lockCost)}
        </span>
      </button>
    )
  }

  const title = crop
    ? `${def.name}${crop.mutation ? ` (${MUTATIONS[crop.mutation].name})` : ''} · ${Math.min(
        100,
        Math.floor(crop.progress * 100)
      )}%` +
      (ready ? ' · Ready to harvest!' : growing ? ` · ~${remain}s left` : dead ? ' · Withered' : '') +
      (watered && growing ? ' · watered' : '')
    : 'Empty soil — select a seed to plant'

  return (
    <button
      onClick={() => onPlotClick(plot)}
      title={title}
      className={`soil relative aspect-square rounded-2xl bg-gradient-to-b from-[#b07c4e] to-[#8a5a33] shadow-[inset_0_3px_8px_rgba(0,0,0,0.35)] ring-1 ring-black/10 transition hover:brightness-110 active:scale-95 ${
        ready ? 'fx-ready' : ''
      }`}
    >
      {/* watered tint */}
      {watered && <span className="absolute inset-0 rounded-2xl bg-sky-900/25 pointer-events-none" />}

      {/* withered tint */}
      {dead && <span className="absolute inset-0 rounded-2xl bg-slate-900/40 pointer-events-none" />}

      {/* the crop */}
      {crop ? (
        <CropSprite crop={crop} def={def} ready={ready} inf={inf} />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-white/50 text-xl font-black opacity-0 hover:opacity-70 transition">
          +
        </span>
      )}

      {/* watered droplet badge */}
      {watered && growing && !inf && (
        <span className="absolute top-1 left-1 text-[10px] leading-none drop-shadow" title="Watered — +50% growth">
          💧
        </span>
      )}

      {/* mysterious mutation sparkle while growing */}
      {crop?.mutation && growing && !inf && (
        <span className="absolute top-1 right-1 text-[10px] leading-none fx-bob" title="This seed feels special…">
          ✨
        </span>
      )}

      {/* infestation banner with countdown */}
      {inf && (
        <span className="absolute inset-x-1 top-1 z-10 block text-center text-[8px] sm:text-[10px] font-black text-white bg-rose-600/95 rounded-full px-1 py-px shadow fx-pop leading-tight">
          {INFEST[inf.type].emoji} {infLeftS}s
        </span>
      )}

      {/* progress bar / ready chip */}
      {crop && !dead && ready ? (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-black bg-amber-300 text-amber-950 rounded-full px-1.5 py-px shadow fx-pop whitespace-nowrap">
          ✓ Ready!
        </span>
      ) : growing ? (
        <span className="absolute bottom-1 left-1 right-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
          <span
            className={`block h-full rounded-full transition-[width] duration-150 ease-linear ${
              inf ? 'bg-rose-400' : 'bg-gradient-to-r from-lime-400 to-emerald-500'
            }`}
            style={{ width: `${crop.progress * 100}%` }}
          />
        </span>
      ) : null}

      {/* floating combat-text style feedback */}
      {myFloaters.map((f) => (
        <Floater key={f.id} f={f} />
      ))}
    </button>
  )
}

// ------------------------------------------------------------
// Crop sprite — visual growth stages + mutation styling
// ------------------------------------------------------------
function CropSprite({ crop, def, ready, inf }) {
  if (crop.dead) {
    return (
      <span className="absolute inset-0 grid place-items-center pointer-events-none">
        <span className="text-2xl sm:text-3xl grayscale opacity-80">🥀</span>
      </span>
    )
  }
  const p = crop.progress
  let emoji = def.emoji
  if (p < 0.15) emoji = '🌰'
  else if (p < 0.45) emoji = '🌱'
  const mid = p >= 0.45 && p < 0.8
  const scale =
    p < 0.15 ? 0.55 : p < 0.45 ? 0.8 : mid ? 0.55 : ready ? 1.05 : 0.8
  const giant = crop.mutation === 'giant' ? 1.4 : 1

  return (
    <span className="absolute inset-0 grid place-items-center pointer-events-none">
      <span
        style={{ transform: `scale(${(scale * giant).toFixed(2)})` }}
        className={`text-xl sm:text-2xl leading-none ${ready ? 'fx-bob' : 'fx-sway'} ${
          mid ? 'saturate-[0.75] opacity-90' : ''
        } ${crop.mutation === 'golden' ? 'fx-golden' : ''}`}
      >
        {emoji}
      </span>
      {inf && (
        <span className="absolute text-lg sm:text-xl fx-wiggle drop-shadow-lg">
          {INFEST[inf.type].emoji}
        </span>
      )}
    </span>
  )
}

// ------------------------------------------------------------
// Floating text (harvest +items, +XP, errors, boosts…)
// ------------------------------------------------------------
const TONES = {
  harvest: 'text-lime-300',
  plant: 'text-emerald-200',
  xp: 'text-sky-300',
  magic: 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]',
  error: 'text-rose-300',
  info: 'text-white',
  coin: 'text-amber-300',
}

function Floater({ f }) {
  const slot = f.slot || 0
  return (
    <span
      className={`fx-float pointer-events-none absolute left-1/2 z-30 font-extrabold text-[11px] sm:text-sm whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)] ${
        TONES[f.tone] || TONES.info
      }`}
      style={{ bottom: `${32 + slot * 24}%` }}
    >
      {f.text}
    </span>
  )
}
