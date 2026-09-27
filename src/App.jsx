import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from './game/useGame'
import { playSfx } from './game/sound'
import { TOOLS, TOOL_IDS, CROPS, CROP_ORDER } from './game/data'
import Hud from './components/Hud'
import GameCanvas from './components/GameCanvas'
import ActionBar from './components/ActionBar'
import ShopModal from './components/ShopModal'
import BarnModal from './components/BarnModal'
import HelpModal from './components/HelpModal'
import Toasts from './components/Toasts'
import LevelBanner from './components/LevelBanner'

const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export default function App() {
  const { state, dispatch, floaters, toasts, banner, resetGame } = useGame()

  const [tool, setTool] = useState('seed')            // 'seed' or one of TOOL_IDS
  const [selectedSeed, setSelectedSeed] = useState('carrot')
  const [modal, setModal] = useState(null)            // 'shop' | 'barn' | 'help'
  const [playing, setPlaying] = useState(false)       // in first-person gameplay mode

  const modalOpen = !!modal
  const rainOn = Date.now() < state.weather.rainUntil

  // ---- plot interaction router (triggered by crosshair click / ACT button) ----
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

  // ---- cycle seeds with Q/E while playing ----------------------
  const cycleSeed = useCallback(
    (dir) => {
      const avail = CROP_ORDER.filter((id) => state.level >= CROPS[id].unlockLevel)
      if (!avail.length) return
      const idx = avail.indexOf(selectedSeed)
      const next = avail[(idx + dir + avail.length) % avail.length]
      setSelectedSeed(next)
      setTool('seed')
    },
    [state.level, selectedSeed]
  )

  // ---- pointer lock / gameplay state ----------------------------
  useEffect(() => {
    if (isTouchDevice()) setPlaying(true)
  }, [])

  // opening a modal frees the cursor
  useEffect(() => {
    if (modalOpen && document.pointerLockElement) document.exitPointerLock()
  }, [modalOpen])

  // ---- keyboard shortcuts ---------------------------------------
  // While in first-person gameplay (playing & no modal): only game keys.
  // Otherwise: full UI shortcuts (S/B/H are reserved for WASD while playing).
  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'escape') {
        setModal(null)
        return
      }
      const inGameplay = playingRef.current && !modalOpen

      if (k === 'm') {
        if (!state.soundOn) playSfx('buy', true)
        dispatch({ type: 'TOGGLE_SOUND' })
        return
      }
      const t = TOOL_IDS.find((id) => TOOLS[id].hotkey === k)
      if (t) {
        setTool(t)
        return
      }
      if (inGameplay) {
        if (k === 'q') cycleSeed(-1)
        else if (k === 'e') cycleSeed(1)
        return
      }
      if (k === 's') setModal((m) => (m === 'shop' ? null : 'shop'))
      else if (k === 'b') setModal((m) => (m === 'barn' ? null : 'barn'))
      else if (k === 'h') setModal((m) => (m === 'help' ? null : 'help'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, modalOpen, cycleSeed, state.soundOn])

  return (
    <div className="h-dvh overflow-hidden bg-sky-200 flex flex-col">
      <Hud
        state={state}
        tool={tool}
        selectedSeed={selectedSeed}
        rainOn={rainOn}
        onToggleSound={() => dispatch({ type: 'TOGGLE_SOUND' })}
        onHelp={() => setModal('help')}
        onOpenBarn={() => setModal('barn')}
      />

      <main className="relative flex-1 min-h-0">
        <GameCanvas
          state={state}
          tool={tool}
          selectedSeed={selectedSeed}
          onPlotClick={onPlotClick}
          floaters={floaters}
          rainOn={rainOn}
          playing={playing}
          setPlaying={setPlaying}
          modalOpen={modalOpen}
        />
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
