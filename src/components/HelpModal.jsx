import { useState } from 'react'
import { CircleHelp, Trash2, MousePointerClick, Droplets, Bug, Sparkles, CloudRain } from 'lucide-react'
import Modal from './Modal'
import { CROPS, CROP_ORDER, MUTATIONS, TOOLS, TOOL_IDS, fmt } from '../game/data'

const TOOL_EMOJI = { hand: '🖐️', water: '💧', trowel: '🥄', spray: '🧴', fertilizer: '⚡' }

// Help modal — how to play, crop table, mutations, events + danger-zone reset.
export default function HelpModal({ onClose, onReset }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <Modal title="How to Play" icon={CircleHelp} onClose={onClose} wide>
      <div className="flex flex-col gap-4 text-sm text-slate-700">
        <section>
          <H><MousePointerClick size={14} /> Getting started</H>
          <ol className="list-decimal ml-5 space-y-1 font-bold text-slate-600 text-[13px]">
            <li>Buy seeds at the <span className="text-emerald-700">Shop</span> (or use your free starter carrots).</li>
            <li>Pick a seed in the bottom bar, then click an empty soil plot to plant it.</li>
            <li>Water growing crops (+50% speed), and watch for weeds 🌿 and pests 🐛!</li>
            <li>Harvest ripe crops with the Hand 🖐️, then sell them at the <span className="text-amber-700">Barn</span>.</li>
            <li>Level up to unlock new crops, and till more plots to expand your garden.</li>
          </ol>
        </section>

        <section>
          <H><Droplets size={14} /> Tools (keys 1–5)</H>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {TOOL_IDS.map((id) => (
              <div key={id} className="flex items-center gap-2 rounded-xl bg-white border-2 border-amber-200 px-2.5 py-1.5">
                <span className="text-lg">{TOOL_EMOJI[id]}</span>
                <div className="text-[12px] leading-tight">
                  <div className="font-extrabold text-slate-700">
                    {TOOLS[id].name} <span className="text-slate-400 font-bold">({TOOLS[id].hotkey})</span>
                  </div>
                  <div className="text-slate-500 font-bold text-[11px]">{TOOLS[id].desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <H><Sparkles size={14} /> Mutations &amp; events</H>
          <ul className="space-y-1 text-[13px] font-bold text-slate-600">
            <li>
              Every seed you plant has a <span className="text-fuchsia-600">4% chance to grow GIANT (×3.5 value)</span> and a{' '}
              <span className="text-amber-600">2% chance to grow GOLDEN (×5 value)</span>.
            </li>
            <li className="flex items-start gap-1.5">
              <Bug size={14} className="mt-0.5 shrink-0 text-rose-500" />
              <span>
                Random <b>weed/pest attacks</b> pause a crop's growth — clear them before the timer runs out or the crop
                <b> withers</b>! Pull weeds with the Hand or Trowel; spray pests with Pest Spray.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CloudRain size={14} className="mt-0.5 shrink-0 text-sky-500" />
              <span>Occasional <b>rain showers</b> water your whole garden for +50% growth speed.</span>
            </li>
          </ul>
        </section>

        <section>
          <H>🌾 Crop catalogue</H>
          <div className="overflow-x-auto rounded-2xl border-2 border-amber-200">
            <table className="w-full text-[12px] font-bold text-slate-600 bg-white">
              <thead>
                <tr className="bg-amber-100 text-amber-900 text-left">
                  <th className="px-2.5 py-1.5">Crop</th>
                  <th className="px-2 py-1.5">Seed</th>
                  <th className="px-2 py-1.5">Grow time</th>
                  <th className="px-2 py-1.5">Sells for</th>
                  <th className="px-2 py-1.5">XP</th>
                  <th className="px-2 py-1.5">Unlock</th>
                </tr>
              </thead>
              <tbody>
                {CROP_ORDER.map((id) => {
                  const c = CROPS[id]
                  return (
                    <tr key={id} className="border-t border-amber-100">
                      <td className="px-2.5 py-1.5 font-extrabold text-slate-800">{c.emoji} {c.name}</td>
                      <td className="px-2 py-1.5">🪙{c.seedCost}</td>
                      <td className="px-2 py-1.5">{c.growth}s</td>
                      <td className="px-2 py-1.5">
                        🪙{fmt(c.sellPrice)}{c.yield > 1 && <span className="text-slate-400"> ×{c.yield}</span>}
                      </td>
                      <td className="px-2 py-1.5">{c.xp}</td>
                      <td className="px-2 py-1.5">{c.unlockLevel === 1 ? '—' : `Level ${c.unlockLevel}`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-[12px] font-bold text-slate-500 bg-white/70 rounded-2xl border-2 border-amber-200 p-3">
          <p>⌨️ Shortcuts: <b>1–5</b> tools · <b>S</b> shop · <b>B</b> barn · <b>H</b> help · <b>M</b> mute · <b>Esc</b> close.</p>
          <p className="mt-1">💾 Your garden auto-saves to this browser and <b>keeps growing while you're away</b> (up to 8 hours).</p>
        </section>

        <section className="border-t-2 border-rose-100 pt-3">
          <button
            onClick={() => {
              if (!confirming) {
                setConfirming(true)
                setTimeout(() => setConfirming(false), 3000)
                return
              }
              onReset()
              onClose()
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-extrabold text-sm border-2 transition ${
              confirming
                ? 'bg-rose-600 border-rose-700 text-white animate-pulse'
                : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Trash2 size={15} />
            {confirming ? 'Really? Click again to wipe everything!' : 'Start a brand new garden'}
          </button>
        </section>
      </div>
    </Modal>
  )
}

function H({ children }) {
  return (
    <h3 className="flex items-center gap-1.5 font-extrabold text-amber-900 text-sm uppercase tracking-wide mb-1.5">
      {children}
    </h3>
  )
}
