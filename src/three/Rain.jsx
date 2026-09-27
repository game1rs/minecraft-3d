// ============================================================
// 🌧️ 3D rain — a field of falling drops over the garden.
// ============================================================
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 650
const AREA = 34
const TOP = 13

export default function Rain({ on }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * AREA
      pos[i * 3 + 1] = Math.random() * TOP
      pos[i * 3 + 2] = (Math.random() - 0.5) * AREA
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const arr = geo.attributes.position.array
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= dt * 17
      arr[i * 3] += dt * 1.2 // slight wind
      if (arr[i * 3 + 1] < 0.2) {
        arr[i * 3 + 1] = TOP - Math.random() * 2
        arr[i * 3] = (Math.random() - 0.5) * AREA
      }
    }
    geo.attributes.position.needsUpdate = true
  })

  if (!on) return null
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#dbeafe" size={0.1} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  )
}
