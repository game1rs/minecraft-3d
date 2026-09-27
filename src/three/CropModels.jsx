// ============================================================
// 🌿 3D crop models — built purely from three.js primitives.
// Growth is continuous: `s1` scales the plant (stem/leaves),
// `s2` scales & ripens the produce. Mutations reveal at
// harvest time (Giant = bigger, Golden = gold materials).
// ============================================================
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CROPS } from '../game/data'

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const leafGreen = '#3d9142'
const stemGreen = '#4a7c2f'

function goldenMat(color) {
  return {
    color: '#fbbf24',
    metalness: 0.85,
    roughness: 0.25,
    emissive: '#b45309',
    emissiveIntensity: 0.45,
  }
}
function vegMat(color) {
  return { color, metalness: 0.03, roughness: 0.65, emissive: '#000000', emissiveIntensity: 0 }
}

// ---------------- Crop shapes ----------------
function Carrot({ s1, s2, golden }) {
  return (
    <>
      <group scale={s1}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 + 0.4
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 0.06, 0.15, Math.cos(a) * 0.06]}
              rotation={[Math.cos(a) * 0.38, 0, -Math.sin(a) * 0.38]}
              castShadow
            >
              <coneGeometry args={[0.035, 0.34, 5]} />
              <meshStandardMaterial color={leafGreen} roughness={0.85} />
            </mesh>
          )
        })}
      </group>
      <group scale={s2} visible={s2 > 0.03}>
        <mesh position={[0, 0.07, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.1, 0.3, 10]} />
          <meshStandardMaterial {...(golden ? goldenMat() : vegMat('#f97316'))} />
        </mesh>
      </group>
    </>
  )
}

function Tomato({ s1, s2, golden }) {
  const ripe = new THREE.Color('#9ccc65').lerp(new THREE.Color('#e53935'), smoothstep(0.55, 0.95, s2))
  return (
    <>
      <group scale={s1}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.04, 0.56, 6]} />
          <meshStandardMaterial color={stemGreen} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color="#3f7d2c" roughness={0.95} />
        </mesh>
      </group>
      <group scale={s2} visible={s2 > 0.03}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.sin(a) * 0.2, 0.55 + (i % 2) * 0.16, Math.cos(a) * 0.2]} castShadow>
              <sphereGeometry args={[0.08, 10, 8]} />
              <meshStandardMaterial
                {...(golden ? goldenMat() : { ...vegMat(), color: ripe.getStyle(), roughness: 0.4 })}
              />
            </mesh>
          )
        })}
      </group>
    </>
  )
}

function Corn({ s1, s2, golden }) {
  return (
    <>
      <group scale={s1}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.96, 6]} />
          <meshStandardMaterial color="#588a34" roughness={0.9} />
        </mesh>
        {[0.25, 0.48, 0.68].map((h, i) => (
          <mesh
            key={i}
            position={[0.12, h, 0]}
            rotation={[0.15, i * 1.2, -1.05]}
            castShadow
          >
            <coneGeometry args={[0.055, 0.5, 5]} />
            <meshStandardMaterial color={leafGreen} roughness={0.9} />
          </mesh>
        ))}
      </group>
      <group scale={s2} visible={s2 > 0.03}>
        <mesh position={[0.1, 0.6, 0.03]} rotation={[0, 0, -0.28]} castShadow>
          <capsuleGeometry args={[0.068, 0.24, 4, 10]} />
          <meshStandardMaterial {...(golden ? goldenMat() : vegMat('#eab308'))} />
        </mesh>
      </group>
    </>
  )
}

function Pumpkin({ s1, s2, golden }) {
  return (
    <>
      <group scale={s1}>
        <mesh position={[0, 0.04, 0]} scale={[1, 0.4, 1]} castShadow>
          <sphereGeometry args={[0.32, 12, 10]} />
          <meshStandardMaterial color="#2f6b2a" roughness={0.95} />
        </mesh>
      </group>
      <group scale={s2} visible={s2 > 0.03}>
        <mesh position={[0, 0.17, 0]} scale={[1, 0.78, 1]} castShadow>
          <sphereGeometry args={[0.31, 16, 12]} />
          <meshStandardMaterial {...(golden ? goldenMat() : vegMat('#ea580c'))} />
        </mesh>
        <mesh position={[0, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.05, 0.16, 6]} />
          <meshStandardMaterial color="#3f6b2f" roughness={0.9} />
        </mesh>
      </group>
    </>
  )
}

function GoldenBerry({ s1, s2, golden }) {
  return (
    <>
      <group scale={s1}>
        <mesh position={[0, 0.26, 0]} castShadow>
          <sphereGeometry args={[0.27, 12, 10]} />
          <meshStandardMaterial color="#33691e" roughness={0.95} />
        </mesh>
      </group>
      <group scale={s2} visible={s2 > 0.03}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          const y = 0.22 + (i % 3) * 0.12
          const r = 0.24
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, y, Math.sin(a) * r]}
              castShadow
            >
              <sphereGeometry args={[0.062, 10, 8]} />
              <meshStandardMaterial
                color="#f6c344"
                roughness={golden ? 0.2 : 0.35}
                metalness={golden ? 0.85 : 0.4}
                emissive="#f59e0b"
                emissiveIntensity={golden ? 1.0 : 0.4}
              />
            </mesh>
          )
        })}
      </group>
    </>
  )
}

const MODELS = { carrot: Carrot, tomato: Tomato, corn: Corn, pumpkin: Pumpkin, goldenberry: GoldenBerry }

function DeadModel() {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 2.1) * 0.1, 0.1, Math.cos(i * 2.1) * 0.1]}
          rotation={[0.55, i * 1.9, 0.4]}
          castShadow
        >
          <coneGeometry args={[0.03, 0.3, 5]} />
          <meshStandardMaterial color="#6b7280" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------- Wrapper ----------------
export default function CropModel({ crop }) {
  const group = useRef()
  const orb = useRef()
  const phase = useRef(Math.random() * Math.PI * 2)
  const ready = crop.progress >= 1
  const p = crop.progress
  const s1 = 0.12 + 0.88 * smoothstep(0.08, 0.5, p)
  const s2 = smoothstep(0.42, 1, p)
  const giant = ready && crop.mutation === 'giant' ? 1.55 : 1
  const golden = ready && crop.mutation === 'golden'
  const Model = MODELS[crop.id] || Carrot

  useFrame((st, dt) => {
    const g = group.current
    if (!g) return
    const t = st.clock.elapsedTime
    const k = 1 - Math.exp(-4 * Math.min(dt, 0.1))
    g.rotation.z = Math.sin(t * 1.4 + phase.current) * 0.045
    g.position.y = 0.37 + (ready ? Math.abs(Math.sin(t * 2.6 + phase.current)) * 0.05 : 0)
    g.scale.setScalar(g.scale.x + (giant - g.scale.x) * k)
    if (orb.current) {
      orb.current.position.set(Math.sin(t * 1.6 + phase.current) * 0.28, 0.75 + Math.sin(t * 2.2) * 0.08, Math.cos(t * 1.6 + phase.current) * 0.28)
      orb.current.rotation.y = t * 2
      orb.current.rotation.x = t * 1.3
    }
  })

  if (crop.dead) {
    return (
      <group position={[0, 0.37, 0]}>
        <DeadModel />
      </group>
    )
  }

  return (
    <group ref={group} position={[0, 0.37, 0]}>
      <Model s1={s1} s2={s2} golden={golden} />
      {crop.mutation && !ready && (
        <mesh ref={orb}>
          <octahedronGeometry args={[0.05, 0]} />
          <meshStandardMaterial color="#e879f9" emissive="#c026d3" emissiveIntensity={1.3} />
        </mesh>
      )}
      {golden && (
        <mesh position={[0, 0.9, 0]}>
          <octahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  )
}
