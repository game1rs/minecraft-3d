import { useCallback, useEffect, useState } from 'react'
import { useGame } from './game/useGame'
import { playSfx } from './game/sound'
import { TOOLS, TOOL_IDS, CROPS } from './game/data'
import Hud from './components/Hud'
import Garden from './components/Garden'
import ActionBar from './components/ActionBar'
import ShopModal from './components/ShopModal'
import BarnModal from './components/BarnModal'
import HelpModal from './components/HelpModal'
import Toasts from './components/Toasts'
import LevelBanner from './components/LevelBanner'

export default function App() {
  const { state, dispatch, floaters, toasts, banner, resetGame } = useGame()

  const [tool, setTool] = useState('seed')            // 'seed' or one of TOOL_IDS
  const [selectedSeed, setSelectedSeed] = useState('carrot')
  const [modal, setModal] = useState(null)            // 'shop' | 'barn' | 'help'

  const rainOn = Date.now() < state.weather.rainUntil

  // ---- plot interaction router --------------------------------
  const onPlotClick = useCallback(
    (plot) => {
      const now = Date.now()
      if (!plot.unlocked) {
        dispatch({ type: 'UNLOCK_PLOT', plotId: plot.id, now })
        return
      }
      switch (tool) {
        case 'seed': return dispatch({ type: 'PLANT', plotId: plot.id, cropId: selectedSeed, now })
        case 'hand': return dispatch({ type: 'HARVEST', plotId: plot.id, now })
        case 'water': return dispatch({ type: 'WATER', plotId: plot.id, now })
        case 'trowel': return dispatch({ type: 'CLEAR', plotId: plot.id, now })
        case 'spray': return dispatch({ type: 'SPRAY', plotId: plot.id, now })
        case 'fertilizer': return dispatch({ type: 'FERTILIZE', plotId: plot.id, now })
        default: return undefined
      }
    },
    [dispatch, tool, selectedSeed]
  )

  // ---- keyboard shortcuts --------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'escape') { setModal(null); return }
      if (k === 's') { setModal((m) => (m === 'shop' ? null : 'shop')); return }
      if (k === 'b') { setModal((m) => (m === 'barn' ? null : 'barn')); return }
      if (k === 'h') { setModal((m) => (m === 'help' ? null : 'help')); return }
      if (k === 'm') { dispatch({ type: 'TOGGLE_SOUND' }); return }
      const t = TOOL_IDS.find((id) => TOOLS[id].hotkey === k)
      if (t) setTool(t)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const toggleSound = useCallback(() => {
    if (!state.soundOn) playSfx('buy', true)
    dispatch({ type: 'TOGGLE_SOUND' })
  }, [dispatch, state.soundOn])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 flex flex-col relative overflow-x-hidden">
      {/* decorative sky */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-3 right-4 text-6xl sm:text-8xl opacity-80 select-none">☀️</div>
        <div className="cloud-drift absolute top-12 text-5xl opacity-70 select-none" style={{ animationDuration: '85s' }}>☁️</div>
        <div className="cloud-drift absolute top-32 text-4xl opacity-50 select-none" style={{ animationDuration: '130s', animationDelay: '-55s' }}>☁️</div>
        <div className="cloud-drift absolute top-56 text-5xl opacity-40 select-none" style={{ animationDuration: '105s', animationDelay: '-20s' }}>☁️</div>
      </div>

      <Hud
        state={state}
        tool={tool}
        selectedSeed={selectedSeed}
        rainOn={rainOn}
        onToggleSound={toggleSound}
        onHelp={() => setModal('help')}
        onOpenBarn={() => setModal('barn')}
      />

      <main className="relative flex-1 flex justify-center px-2 sm:px-4 pt-4 pb-44 sm:pb-40">
        <div className="w-full flex flex-col items-center gap-3">
          <Garden state={state} onPlotClick={onPlotClick} floaters={floaters} rainOn={rainOn} />
          <p className="text-[11px] sm:text-xs font-bold text-emerald-900/50 text-center max-w-md">
            {tool === 'seed'
              ? `Planting ${CROPS[selectedSeed].emoji} ${CROPS[selectedSeed].name} — click an empty plot!`
              : `${TOOLS[tool].name}: ${TOOLS[tool].desc}`}
            <span className="hidden sm:inline"> · keys 1–5 tools · S shop · B barn · H help</span>
          </p>
        </div>
      </main>

      <ActionBar
        state={state}
        tool={tool}
        setTool={setTool}
        selectedSeed={selectedSeed}
        setSelectedSeed={setSelectedSeed}
        onOpenShop={() => setModal('shop')}
        onOpenBarn={() => setModal('barn')}
      />

      <Toasts toasts={toasts} />
      <LevelBanner banner={banner} />

      {modal === 'shop' && <ShopModal state={state} dispatch={dispatch} onClose={() => setModal(null)} />}
      {modal === 'barn' && <BarnModal state={state} dispatch={dispatch} onClose={() => setModal(null)} />}
      {modal === 'help' && (
        <HelpModal
          onClose={() => setModal(null)}
          onReset={() => {
            resetGame()
            setTool('seed')
            setSelectedSeed('carrot')
          }}
        />
      )}
    </div>
  )
}
