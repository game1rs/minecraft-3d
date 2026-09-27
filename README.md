# 🌱 Grow a Garden

A cozy 2D top-down **garden simulation game** inspired by Roblox's *Grow a Garden* — built with **React 18**, **Tailwind CSS v4**, **Lucide icons** and a WebAudio-synthesized sound engine. No audio files, no image assets: everything is emoji, CSS and code.

## ▶️ Play

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run test:logic # headless reducer/gameplay-logic test suite
```

## 🎮 Gameplay

| System | Details |
| --- | --- |
| **Plots** | 5×5 grid — start with 4 tilled plots, buy the rest at scaling prices. States: *Locked → Empty → Planted/Growing (progress bar) → Ready → Withered* |
| **Crops** | 🥕 Carrot (5s) · 🍅 Tomato (12s) · 🌽 Corn (25s, ×2 yield) · 🎃 Pumpkin (45s) · 🫐 Golden Berry (90s) — each with its own cost, XP, sell price and level unlock |
| **Tools** | Hand (harvest/pull weeds), Watering Can (+50% growth), Trowel (clear), Pest Spray, Fertilizer (instant boost consumable) — keys **1–5** |
| **Upgrades** | 💧 Golden Watering Can (waters 3×3), ✨ Deluxe Fertilizer (+60% boosts), 🎒 Backpack tiers (20 → 40 → 80 → 160 capacity) |
| **Mutations** | 4% **Giant** (×3.5 value) and 2% **Golden** (×5 value) rolled at planting time |
| **Events** | Random 🌿 weed / 🐛 pest attacks (pause growth, wither the crop if ignored) and 🌧️ rain showers that water the whole garden |
| **Economy** | Coins, seed shop (buy 1 / buy 10), sell barn with per-crop and sell-all, XP/levels with coin rewards |
| **Persistence** | Auto-saves to localStorage every 2.5s; **offline growth** (up to 8h) is applied on return with a welcome-back summary |

## 🏗️ Architecture

```
src/
  App.jsx                  — layout, input routing, keyboard shortcuts
  index.css                — Tailwind + custom keyframe animations & textures
  game/
    data.js                — all balance constants (crops, tools, upgrades, events)
    reducer.js             — pure-ish game reducer: every action validated + fx events
    useGame.js             — custom hook: 10 fps tick loop, autosave, fx consumption
    sound.js               — WebAudio synthesized SFX (no files)
    storage.js             — localStorage load/save/clear
  components/
    Hud.jsx Garden.jsx ActionBar.jsx Modal.jsx
    ShopModal.jsx BarnModal.jsx HelpModal.jsx
    Toasts.jsx LevelBanner.jsx
```

**How the loop works:** a `setInterval` (100ms) dispatches `TICK` with the current timestamp. The reducer computes `dt = now − lastTick`, advances every crop's progress (×1.5 if watered/raining), expires infestations and schedules random events. Because growth is derived from wall-clock deltas, a reload or a long absence is just a single large `dt` — that *is* the offline growth system. CSS transitions keep progress bars smooth between ticks, and transient `fx` events (sounds, floating text, toasts, banners) emitted by the reducer are consumed by `useGame` and cleared.
