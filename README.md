# 🌱 Grow a Garden 3D

A cozy **3D first-person garden simulation game** inspired by Roblox's *Grow a Garden* — built with **React 18**, **react-three-fiber (Three.js)**, **Tailwind CSS v4**, **Lucide icons** and a WebAudio-synthesized sound engine. No audio files, no model assets: the whole world is generated from three.js primitives.

## ▶️ Play

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run test:logic # headless reducer/gameplay-logic test suite
```

## 🎮 Controls

| Input | Action |
| --- | --- |
| **Click ▶ Play** | Enter first-person mode (pointer lock) |
| **Mouse** | Look around · **WASD** walk · **Shift** run · **Space** jump |
| 🎯 **Crosshair + Left click** | Point & place — plant / water / harvest / spray / boost the aimed plot |
| **1–5** | Switch tools (Hand, Watering Can, Trowel, Pest Spray, Fertilizer) |
| **Q / E** | Cycle unlocked seeds while playing |
| **S · B · H · M** | Shop · Barn · Help · Mute (when the cursor is free, e.g. after ESC) |
| **ESC** | Free the cursor / close dialogs |
| *Touch devices* | Virtual joystick to move, drag to look, ACT & JUMP buttons |

If pointer lock is unavailable (e.g. embedded previews), the game automatically falls back to **drag-to-look** with click-to-act.

## 🌍 Gameplay

| System | Details |
| --- | --- |
| **Plots** | 5×5 fenced garden — start with 4 tilled plots, buy the rest (aim at the 🔂 for-sale signs). States: *Locked → Empty → Growing → Ready → Withered* |
| **Crops** | 🥕 Carrot (5s) · 🍅 Tomato (12s) · 🌽 Corn (25s, ×2 yield) · 🎃 Pumpkin (45s) · 🫐 Golden Berry (90s) — each with continuous 3D growth animation, cost, XP, sell price and level unlock |
| **Tools** | Hand (harvest/pull weeds), Watering Can (+50% growth), Trowel (clear), Pest Spray, Fertilizer (instant boost consumable) — keys **1–5** |
| **Upgrades** | 💧 Golden Watering Can (waters 3×3), ✨ Deluxe Fertilizer (+60% boosts), 🎒 Backpack tiers (20 → 40 → 80 → 160 capacity) |
| **Mutations** | 4% **Giant** (×3.5 value, visibly larger) and 2% **Golden** (×5 value, gold materials) rolled at planting — teased by a mysterious orbiting sparkle ✨ |
| **Events** | Random 🌿 weed / 🐛 pest attacks (3D weeds sprout & bugs orbit; crops wither if ignored) and 🌧️ rain showers with falling particles that water everything |
| **Economy** | Coins, seed shop (buy 1 / buy 10), sell barn with per-crop and sell-all, XP/levels with coin rewards |
| **World** | Sunny sky with drifting clouds, trees, flowers, a scarecrow, a gated fence (walk in through the south gate!), soft shadows and weather-aware lighting/fog |
| **Persistence** | Auto-saves to localStorage every 2.5s; **offline growth** (up to 8h) is applied on return with a welcome-back summary |

## 🏗️ Architecture

```
src/
  App.jsx                  — layout, input routing, gameplay-vs-UI hotkeys
  index.css                — Tailwind + custom keyframe animations & textures
  game/                    — engine (2D-agnostic, fully unit-testable)
    data.js                — all balance constants (crops, tools, upgrades, events)
    reducer.js             — game reducer: every action validated + fx events
    useGame.js             — custom hook: 10 fps tick loop, autosave, fx consumption
    sound.js               — WebAudio synthesized SFX (no files)
    storage.js             — localStorage load/save/clear
  three/                   — 3D layer (react-three-fiber)
    Scene.jsx              — Canvas, sky, weather lights, crosshair raycaster
    Player.jsx             — first-person controller (lock/drag/touch + fence collision)
    Plots3D.jsx            — soil plots, crops, infestations, rings, floating text
    CropModels.jsx         — per-crop primitive models with continuous growth
    Environment3D.jsx      — ground, fence, trees, scarecrow, clouds
    Rain.jsx               — rain particle field
  components/
    GameCanvas.jsx         — 3D viewport, crosshair HUD, click-to-play, touch controls
    Hud.jsx ActionBar.jsx Modal.jsx ShopModal.jsx BarnModal.jsx HelpModal.jsx
    Toasts.jsx LevelBanner.jsx
```

**How the loop works:** a `setInterval` (100ms) dispatches `TICK` with the current timestamp. The reducer computes `dt = now − lastTick`, advances every crop's progress (×1.5 if watered/raining), expires infestations and schedules random events — the same wall-clock-delta system powers offline growth after a reload. The 3D layer is a pure function of game state: R3F re-renders the scene at 10Hz, while `useFrame` handles smooth animation (sway, bobbing, orbiting pests, weather transitions) at full frame rate. The crosshair casts a ray from the screen center into invisible plot hit-boxes to determine the aimed plot, and clicks/ACT dispatch the same reducer actions as before.
