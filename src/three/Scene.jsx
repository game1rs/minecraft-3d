// ============================================================
// 🎬 The R3F scene: sky, weather-aware lights, world, plots,
// player, rain and the crosshair raycaster ("Aimer").
// ============================================================
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import Environment3D from './Environment3D'
import Plots3D from './Plots3D'
import Player from './Player'
import Rain from './Rain'

const MemoEnvironment3D = memo(Environment3D)

export default function Scene({ state, tool, aimedId, setAimedId, floaters, rainOn, playerProps }) {
  const hitMeshes = useRef({})
  const registerHit = useCallback((id, mesh) => {
    if (mesh) hitMeshes.current[id] = mesh
    else delete hitMeshes.current[id]
  }, [])

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 72, near: 0.1, far: 160, position: [0, 1.65, 10.4] }}
      gl={{ antialias: true }}
    >
      <WeatherRig rainOn={rainOn} />
      <Sky
        distance={450000}
        sunPosition={[60, 45, 30]}
        turbidity={rainOn ? 12 : 5.5}
        rayleigh={rainOn ? 4 : 1.6}
      />
      <MemoEnvironment3D />
      <Plots3D state={state} tool={tool} aimedId={aimedId} floaters={floaters} onRegisterHit={registerHit} />
      <Aimer hitMeshes={hitMeshes} onAim={setAimedId} />
      <Player {...playerProps} />
      <Rain on={rainOn} />
    </Canvas>
  )
}

// ------------------------------------------------------------
// Rays from the screen center (the crosshair) into the plot
// hit-boxes; reports the currently aimed plot id.
// ------------------------------------------------------------
function Aimer({ hitMeshes, onAim }) {
  const camera = useThree((s) => s.camera)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const lastId = useRef(undefined)
  useFrame(() => {
    raycaster.setFromCamera(center, camera)
    raycaster.far = 12
    const meshes = Object.values(hitMeshes.current)
    const hits = raycaster.intersectObjects(meshes, false)
    const id = hits.length ? hits[0].object.userData.plotId : null
    if (id !== lastId.current) {
      lastId.current = id
      onAim(id)
    }
  })
  return null
}

// ------------------------------------------------------------
// Weather-aware lighting & fog (sunny ⇄ rainy).
// ------------------------------------------------------------
function WeatherRig({ rainOn }) {
  const dir = useRef()
  const hemi = useRef()
  const scene = useThree((s) => s.scene)
  const fog = useMemo(() => new THREE.Fog('#cfe8f7', 30, 85), [])
  const sunny = useMemo(
    () => ({ fog: new THREE.Color('#cfe8f7'), near: 30, far: 85, dir: 1.3, hemi: 0.75 }),
    []
  )
  const rainy = useMemo(
    () => ({ fog: new THREE.Color('#8fa8bb'), near: 13, far: 48, dir: 0.5, hemi: 0.4 }),
    []
  )
  useEffect(() => {
    scene.fog = fog
  }, [scene, fog])

  // make sure the shadow frustum covers the whole yard
  useEffect(() => {
    const l = dir.current
    if (!l) return
    const cam = l.shadow.camera
    cam.left = -13
    cam.right = 13
    cam.top = 13
    cam.bottom = -13
    cam.near = 2
    cam.far = 50
    cam.updateProjectionMatrix()
    l.shadow.bias = -0.0004
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const k = 1 - Math.exp(-2.5 * dt)
    const t = rainOn ? rainy : sunny
    if (dir.current) dir.current.intensity += (t.dir - dir.current.intensity) * k
    if (hemi.current) hemi.current.intensity += (t.hemi - hemi.current.intensity) * k
    fog.color.lerp(t.fog, k)
    fog.near += (t.near - fog.near) * k
    fog.far += (t.far - fog.far) * k
  })

  return (
    <>
      <hemisphereLight ref={hemi} color="#cfe8ff" groundColor="#7ea86b" intensity={0.75} />
      <directionalLight
        ref={dir}
        position={[14, 18, 8]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-camera-near={2}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
      />
    </>
  )
}
