// ============================================================
// 🎮 useGame — custom hook wiring the game together:
//   • 10 fps game-loop timer driving the TICK reducer action
//   • auto-save to localStorage (+ offline growth via big dt)
//   • consumption of reducer `fx` events into sounds,
//     floating texts, toasts and the level-up banner
// ============================================================
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { gameReducer, hydrate } from './reducer'
import { loadSave, saveGame, clearSave } from './storage'
import { playSfx } from './sound'

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => hydrate(loadSave()))
  const [floaters, setFloaters] = useState([])
  const [toasts, setToasts] = useState([])
  const [banner, setBanner] = useState(null)

  const addFloater = useCallback((f) => {
    setFloaters((arr) => [...arr, f])
    setTimeout(() => setFloaters((arr) => arr.filter((x) => x.id !== f.id)), 1400)
  }, [])

  const addToast = useCallback((t) => {
    setToasts((arr) => [...arr.slice(-3), t])
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== t.id)), 3800)
  }, [])

  // ---- game loop: 10 state updates/sec; CSS transitions keep bars smooth
  useEffect(() => {
    const iv = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 100)
    return () => clearInterval(iv)
  }, [])

  // ---- first-run onboarding
  const [isFresh] = useState(() => !loadSave())
  useEffect(() => {
    if (!isFresh) return
    addToast({ id: 'w1', tone: 'info', text: '👋 Welcome to your garden!' })
    const t = setTimeout(
      () => addToast({ id: 'w2', tone: 'success', text: 'Pick a seed below, then tap a soil plot to plant it 🌱' }),
      1900
    )
    return () => clearTimeout(t)
  }, [isFresh, addToast])

  // ---- consume transient effects emitted by the reducer
  useEffect(() => {
    if (!state.fx.length) return
    for (const f of state.fx) {
      if (f.kind === 'sfx') playSfx(f.name, state.soundOn)
      else if (f.kind === 'floater') addFloater(f)
      else if (f.kind === 'toast') addToast({ ...f, id: f.id })
      else if (f.kind === 'banner') {
        setBanner(f)
        setTimeout(() => setBanner((b) => (b && b.id === f.id ? null : b)), 2600)
      }
    }
    dispatch({ type: 'CLEAR_FX' })
  }, [state.fx, state.soundOn, addFloater, addToast])

  // ---- auto-save & pause random events while the tab is hidden
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  useEffect(() => {
    const save = () => saveGame(stateRef.current)
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        save()
        dispatch({ type: 'PAUSE_EVENTS', now: Date.now() })
      }
    }
    const iv = setInterval(save, 2500)
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVis)
      save()
    }
  }, [])

  const resetGame = useCallback(() => {
    clearSave()
    setFloaters([])
    setBanner(null)
    dispatch({ type: 'NEW_GAME', now: Date.now() })
  }, [])

  return { state, dispatch, floaters, toasts, banner, resetGame }
}
