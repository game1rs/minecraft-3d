// ============================================================
// 🟫 3D garden plots — soil tiles, crops, weeds/pests, ready
// rings, aim highlight, floating texts & invisible hit-boxes
// used by the crosshair raycaster.
// ============================================================
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import CropModel from './CropModels'
import { CROPS, TOOLS, INFEST, plotCost, fmt } from '../game/data'

export const SPACING = 1.5
const SOIL_TOP = 0.36

const TONES = {
  harvest: 'text-lime-300',
  plant: 'text-emerald-200',
  xp: 'text-sky-300',
  magic: 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]',
  error: 'text-rose-300',
  info: 'text-white',
  coin: 'text-amber-300',
}

export default function Plots3D({ state, tool, aimedId, floaters, onRegisterHit }) {
  const lockCost = plotCost(state.plots.filter((p) => p.unlocked).length)
  const aimColor = tool === 'seed' ? '#22c55e' : TOOLS[tool]?.color || '#ffffff'
  return (
    <group>
      {state.plots.map((p) => (
        <Plot3D
          key={p.id}
          plot={p}
          aimed={aimedId === p.id}
          aimColor={aimColor}
          lockCost={lockCost}
          floaters={floaters}
          onRegisterHit={onRegisterHit}
        />
      ))}
    </group>
  )
}

function Plot3D({ plot, aimed, aimColor, lockCost, floaters, onRegisterHit }) {
  const hitRef = useRef()
  const soilMat = useRef()
  const ringRef = useRef()
  const readyRef = useRef()
  const x = (plot.col - 2) * SPACING
  const z = (plot.row - 2) * SPACING
  const crop = plot.crop
  const dead = !!crop?.dead
  const ready = !!crop && !dead && crop.progress >= 1
  const watered = !!crop?.watered && !dead
  const inf = crop?.infestation

  useEffect(() => {
    if (hitRef.current) onRegisterHit(plot.id, hitRef.current)
    return () => onRegisterHit(plot.id, null)
  }, [plot.id, onRegisterHit])

  // soil color target (watered = darker, withered = ashen)
  const soilTarget = useMemo(() => {
    if (dead) return new THREE.Color('#7d6a55')
    if (watered) return new THREE.Color('#6f4a2a')
    return new THREE.Color('#a0714a')
  }, [dead, watered])

  useFrame((st, dt) => {
    if (soilMat.current) soilMat.current.color.lerp(soilTarget, 1 - Math.exp(-6 * Math.min(dt, 0.1)))
    if (ringRef.current) ringRef.current.rotation.z += dt * 1.8
    if (readyRef.current) {
      const m = readyRef.current.material
      m.opacity = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(st.clock.elapsedTime * 3.2))
      const s = 1 + 0.06 * Math.sin(st.clock.elapsedTime * 3.2)
      readyRef.current.scale.setScalar(s)
    }
  })

  const myFloaters = floaters.filter((f) => f.plotId === plot.id)

  return (
    <group position={[x, 0, z]}>
      {/* hit box for the crosshair raycaster */}
      <mesh ref={hitRef} position={[0, 0.7, 0]} userData={{ plotId: plot.id }}>
        <boxGeometry args={[1.42, 1.5, 1.42]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {plot.unlocked ? (
        <>
          {/* tilled soil */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.28, 0.22, 1.28]} />
            <meshStandardMaterial ref={soilMat} color="#a0714a" roughness={0.95} />
          </mesh>
          {/* soil speckles */}
          <Speckles />

          {crop && !dead && ready && (
            <mesh ref={readyRef} position={[0, SOIL_TOP + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.55, 0.7, 32]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {crop && <CropModel crop={crop} />}

          {inf?.type === 'weeds' && <Weeds seed={plot.id} />}
          {inf?.type === 'pests' && <Pests seed={plot.id} />}

          {watered && crop && !ready && !inf && (
            <Html position={[0, 0.95, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div className="text-sm leading-none select-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
                💧
              </div>
            </Html>
          )}

          {inf && (
            <Html position={[0, 1.35, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div className="fx-pop bg-rose-600/95 text-white text-[11px] font-black rounded-full px-2 py-0.5 shadow whitespace-nowrap">
                {INFEST[inf.type].emoji} {Math.max(0, Math.ceil((inf.endsAt - Date.now()) / 1000))}s
              </div>
            </Html>
          )}
        </>
      ) : (
        <>
          {/* untilled tile + for-sale sign */}
          <mesh position={[0, 0.17, 0]} receiveShadow>
            <boxGeometry args={[1.28, 0.05, 1.28]} />
            <meshStandardMaterial color="#5c8a3c" roughness={1} />
          </mesh>
          <Sign />
          <Html position={[0, 1.25, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div className="bg-emerald-950/80 text-amber-100 text-[10px] font-black rounded-full px-2 py-0.5 shadow whitespace-nowrap">
              🔒 🪙{fmt(lockCost)}
            </div>
          </Html>
        </>
      )}

      {/* crosshair aim highlight */}
      {aimed && (
        <mesh ref={ringRef} position={[0, SOIL_TOP + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.68, 32]} />
          <meshBasicMaterial color={aimColor} transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* floating feedback texts */}
      {myFloaters.map((f) => (
        <Html
          key={f.id}
          position={[0, 1.6 + (f.slot || 0) * 0.3, 0]}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`fx-float font-extrabold text-sm whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)] ${
              TONES[f.tone] || TONES.info
            }`}
          >
            {f.text}
          </div>
        </Html>
      ))}
    </group>
  )
}

// little brown speckles on the soil
function Speckles() {
  const dots = useMemo(() => {
    const rng = mulberry32(42)
    return Array.from({ length: 7 }, () => {
      const a = rng() * Math.PI * 2
      const r = 0.15 + rng() * 0.45
      return [Math.sin(a) * r, 0.362, Math.cos(a) * r, 0.012 + rng() * 0.012]
    })
  }, [])
  return (
    <group>
      {dots.map(([dx, dy, dz, r], i) => (
        <mesh key={i} position={[dx, dy, dz]}>
          <sphereGeometry args={[r, 6, 5]} />
          <meshStandardMaterial color="#5e3d22" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// wooden "for sale" sign on locked plots
function Sign() {
  return (
    <group position={[0.45, 0, 0.42]} rotation={[0, -0.6, 0]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.64, 6]} />
        <meshStandardMaterial color="#7c4a21" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.52, 0.3, 0.04]} />
        <meshStandardMaterial color="#8b5e34" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.62, 0.025]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.015]} />
        <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Weeds({ seed }) {
  const group = useRef()
  const tufts = useMemo(() => {
    const rng = mulberry32(seed * 97 + 11)
    return Array.from({ length: 4 }, (_, i) => {
      const a = rng() * Math.PI * 2
      const r = 0.35 + rng() * 0.2
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, h: 0.28 + rng() * 0.14, ph: i * 1.7 + rng() }
    })
  }, [seed])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    group.current?.children.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 5 + tufts[i].ph) * 0.25
    })
  })
  return (
    <group ref={group} position={[0, SOIL_TOP, 0]}>
      {tufts.map((w, i) => (
        <mesh key={i} position={[w.x, w.h / 2, w.z]} castShadow>
          <coneGeometry args={[0.05, w.h, 5]} />
          <meshStandardMaterial color="#57a845" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Pests({ seed }) {
  const refs = useRef([])
  const phase = useRef(seed * 1.3)
  useFrame((st) => {
    const t = st.clock.elapsedTime * 2.2 + phase.current
    refs.current.forEach((m, i) => {
      if (!m) return
      const a = t + (i * Math.PI * 2) / 3
      m.position.set(Math.sin(a) * 0.34, 0.55 + Math.sin(t * 3 + i) * 0.07, Math.cos(a) * 0.34)
    })
  })
  return (
    <group position={[0, SOIL_TOP, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => (refs.current[i] = m)} castShadow>
          <sphereGeometry args={[0.065, 8, 6]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// re-export for the scene
export { SOIL_TOP }
