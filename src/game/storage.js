// ============================================================
// 💾 LocalStorage save system (auto-save handled in useGame)
// ============================================================
import { SAVE_KEY } from './data'

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveGame(state) {
  try {
    const { fx, ...rest } = state
    const payload = { ...rest, fx: [], lastTick: Date.now() }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    // storage may be unavailable (private mode / quota) — game continues in memory
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* ignore */ }
}
