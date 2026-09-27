// ============================================================
// 🌳 World environment — ground, dirt path, fenced garden with
// gate, trees, grass tufts, flowers, a scarecrow & clouds.
// ============================================================
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function Environment3D() {
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#74b84e" roughness={1} />
      </mesh>

      {/* garden base platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[8.7, 0.16, 8.7]} />
        <meshStandardMaterial color="#6f4a2d" roughness={0.95} />
      </mesh>

      {/* dirt path to the gate */}
      <mesh position={[0, 0.012, 6.9]} receiveShadow>
        <boxGeometry args={[2.0, 0.04, 4.8]} />
        <meshStandardMaterial color="#cfa76a" roughness={1} />
      </mesh>

      <Fence />
      <GateSign />
      <Trees />
      <Tufts />
      <Flowers />
      <Scarecrow />
      <Clouds />
    </group>
  )
}

// ------------------------------------------------------------
function Fence() {
  const S = 4.6
  const { posts, rails } = useMemo(() => {
    const posts = []
    const rails = []
    const step = (2 * S) / 8
    for (let i = 0; i <= 8; i++) {
      const t = -S + i * step
      posts.push([t, -S], [S, t], [-S, t])
      if (Math.abs(t) >= 1.25) posts.push([t, S])
    }
    // [x, z, length, alongZ]
    rails.push([0, -S, 2 * S, false], [S, 0, 2 * S, true], [-S, 0, 2 * S, true])
    const segLen = S - 1.3
    rails.push([(1.3 + S) / 2, S, segLen, false], [-(1.3 + S) / 2, S, segLen, false])
    return { posts, rails }
  }, [])

  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, 0.47, z]} castShadow>
          <cylinderGeometry args={[0.055, 0.07, 0.95, 6]} />
          <meshStandardMaterial color="#8b5e34" roughness={0.9} />
        </mesh>
      ))}
      {[0.42, 0.78].map((h) =>
        rails.map(([x, z, len, alongZ], i) => (
          <mesh
            key={`r${h}-${i}`}
            position={[x, h, z]}
            rotation={[0, alongZ ? Math.PI / 2 : 0, 0]}
            castShadow
          >
            <boxGeometry args={[len, 0.055, 0.075]} />
            <meshStandardMaterial color="#a47148" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* gate posts */}
      {[1.3, -1.3].map((x) => (
        <mesh key={`g${x}`} position={[x, 0.58, S]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 1.16, 6]} />
          <meshStandardMaterial color="#7c4a21" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function GateSign() {
  return (
    <Html position={[0, 1.5, 4.72]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="bg-emerald-700/85 text-white text-xs font-extrabold rounded-full px-3 py-1 shadow-lg whitespace-nowrap">
        🌱 Grow a Garden
      </div>
    </Html>
  )
}

function Trees() {
  const TREES = [
    [-8.5, -6.5, 1.1],
    [7.8, -7.6, 0.9],
    [-9.5, 1.5, 1.25],
    [9.3, 4.2, 1.0],
    [-7, 8.6, 0.95],
    [8.6, 8.8, 1.15],
    [-4.5, -9.6, 0.85],
    [4.8, -9.8, 1.05],
  ]
  return (
    <group>
      {TREES.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.26, 1.5, 7]} />
            <meshStandardMaterial color="#7c4a21" roughness={0.95} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <sphereGeometry args={[1.15, 12, 10]} />
            <meshStandardMaterial color={i % 2 ? '#3e9b4f' : '#46a857'} roughness={0.9} />
          </mesh>
          <mesh position={[0.45, 2.5, 0.2]} castShadow>
            <sphereGeometry args={[0.75, 10, 8]} />
            <meshStandardMaterial color="#3e9b4f" roughness={0.9} />
          </mesh>
          <mesh position={[-0.5, 2.35, -0.25]} castShadow>
            <sphereGeometry args={[0.65, 10, 8]} />
            <meshStandardMaterial color="#43945a" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Tufts() {
  const tufts = useMemo(() => {
    const rng = mulberry32(7)
    return Array.from({ length: 46 }, () => {
      let x = 0
      let z = 0
      // keep off the garden bed & path
      for (let tries = 0; tries < 20; tries++) {
        const a = rng() * Math.PI * 2
        const r = 5.6 + rng() * 11
        x = Math.sin(a) * r
        z = Math.cos(a) * r
        if (!(Math.abs(x) < 1.6 && z > 3 && z < 9.5)) break
      }
      return { x, z, s: 0.7 + rng() * 0.9, c: rng() > 0.5 ? '#4c9a3f' : '#3f8a36' }
    })
  }, [])
  return (
    <group>
      {tufts.map((t, i) => (
        <mesh key={i} position={[t.x, 0.09 * t.s, t.z]} scale={t.s}>
          <coneGeometry args={[0.07, 0.2, 5]} />
          <meshStandardMaterial color={t.c} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Flowers() {
  const flowers = useMemo(() => {
    const rng = mulberry32(23)
    const colors = ['#f472b6', '#facc15', '#f87171', '#e0f2fe', '#c084fc']
    return Array.from({ length: 18 }, () => {
      let x = 0
      let z = 0
      for (let tries = 0; tries < 20; tries++) {
        const a = rng() * Math.PI * 2
        const r = 5.4 + rng() * 10
        x = Math.sin(a) * r
        z = Math.cos(a) * r
        if (!(Math.abs(x) < 1.6 && z > 3 && z < 9.5)) break
      }
      return { x, z, c: colors[Math.floor(rng() * colors.length)] }
    })
  }, [])
  return (
    <group>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 4]} />
            <meshStandardMaterial color="#3f8a36" roughness={1} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color={f.c} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Scarecrow() {
  return (
    <group position={[6.4, 0, -2.6]} rotation={[0, -2.5, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 6]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.18, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.95, 0.07, 0.07]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[0.36, 0.42, 0.22]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#f1c27d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <coneGeometry args={[0.21, 0.24, 8]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Clouds() {
  const group = useRef()
  const CLOUDS = useMemo(
    () => [
      { x: -22, y: 13.5, z: -18, s: 1.3 },
      { x: 12, y: 15.5, z: -26, s: 1.7 },
      { x: -8, y: 16.5, z: 21, s: 1.5 },
      { x: 24, y: 12.5, z: 9, s: 1.1 },
      { x: -30, y: 14, z: 6, s: 1.2 },
    ],
    []
  )
  useFrame((_, dt) => {
    if (!group.current) return
    group.current.children.forEach((c, i) => {
      c.position.x += dt * (0.25 + i * 0.06)
      if (c.position.x > 38) c.position.x = -38
    })
  })
  return (
    <group ref={group}>
      {CLOUDS.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          <mesh>
            <sphereGeometry args={[1.15, 10, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
          <mesh position={[1.0, -0.15, 0.2]}>
            <sphereGeometry args={[0.8, 10, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
          <mesh position={[-0.95, -0.2, -0.1]}>
            <sphereGeometry args={[0.72, 10, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
