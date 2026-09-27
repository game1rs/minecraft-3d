// ============================================================
// 🚶 First-person player controller.
//  • Desktop "lock" mode: pointer lock + mouse look, WASD,
//    Shift to run, Space to jump, left-click = use tool.
//  • Desktop fallback "drag" mode (used when pointer lock is
//    unavailable, e.g. embedded previews): drag to look,
//    click (without dragging) = use tool.
//  • "touch" mode: virtual joystick + drag-look on the canvas
//    + on-screen ACTION/JUMP buttons.
// Includes simple collision against the garden fence so the
// player enters through the south gate.
// ============================================================
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { playSfx } from '../game/sound'

const EYE = 1.65
const BOUNDS = 9.2
const SPEED = 3.6
const RUN = 6.2
const JUMP_V = 5.2
const FENCE = 4.35 // half-size of the fenced garden interior
const GATE = 1.05 // half-width of the south gate opening
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function Player({ mode, active, onAction, onLockStateChange, soundOn, touchInput }) {
  const { camera, gl } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(-0.05)
  const pos = useRef(new THREE.Vector3(0, EYE, 9.2))
  const vy = useRef(0)
  const grounded = useRef(true)
  const keys = useRef({})
  const drag = useRef(null)
  const look = useRef(null)
  const stepAcc = useRef(0)
  const actionRef = useRef(onAction)
  actionRef.current = onAction
  const activeRef = useRef(active)
  activeRef.current = active
  const modeRef = useRef(mode)
  modeRef.current = mode
  const soundRef = useRef(soundOn)
  soundRef.current = soundOn

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  // ---------------- keyboard ----------------
  useEffect(() => {
    const down = (e) => {
      if (!activeRef.current) return
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      keys.current[e.code] = true
    }
    const up = (e) => {
      keys.current[e.code] = false
    }
    const clear = () => {
      keys.current = {}
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  // ---------------- mouse look / click ----------------
  useEffect(() => {
    const canvas = gl.domElement
    const locked = () => document.pointerLockElement === canvas

    const onMouseMove = (e) => {
      if (locked()) {
        yaw.current -= e.movementX * 0.0022
        pitch.current = clamp(pitch.current - e.movementY * 0.0022, -1.45, 1.45)
      } else if (drag.current && modeRef.current === 'drag') {
        if (Math.abs(e.movementX) + Math.abs(e.movementY) > 4) drag.current.moved = true
        if (drag.current.moved) {
          yaw.current -= e.movementX * 0.005
          pitch.current = clamp(pitch.current - e.movementY * 0.005, -1.45, 1.45)
        }
      }
    }
    const onMouseDown = (e) => {
      if (e.button !== 0) return
      if (locked()) {
        actionRef.current()
        return
      }
      if (modeRef.current === 'drag' && activeRef.current) {
        drag.current = { moved: false }
      }
    }
    const onMouseUp = () => {
      if (drag.current && modeRef.current === 'drag' && activeRef.current && !drag.current.moved) {
        actionRef.current()
      }
      drag.current = null
    }
    const onLockChange = () => {
      if (!locked()) keys.current = {}
      onLockStateChange?.(locked())
    }
    const onLockError = () => onLockStateChange?.(false)

    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('pointerlockerror', onLockError)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('pointerlockerror', onLockError)
    }
  }, [gl, onLockStateChange])

  // ---------------- touch look ----------------
  useEffect(() => {
    if (mode !== 'touch') return undefined
    const canvas = gl.domElement
    const onStart = (e) => {
      if (!activeRef.current) return
      const t = e.changedTouches[0]
      look.current = { id: t.identifier, x: t.clientX, y: t.clientY }
    }
    const onMove = (e) => {
      if (!look.current || !activeRef.current) return
      for (const t of e.changedTouches) {
        if (t.identifier !== look.current.id) continue
        const dx = t.clientX - look.current.x
        const dy = t.clientY - look.current.y
        look.current.x = t.clientX
        look.current.y = t.clientY
        yaw.current -= dx * 0.0055
        pitch.current = clamp(pitch.current - dy * 0.0055, -1.45, 1.45)
      }
      e.preventDefault()
    }
    const onEnd = (e) => {
      for (const t of e.changedTouches) if (t.identifier === look.current?.id) look.current = null
    }
    canvas.addEventListener('touchstart', onStart, { passive: true })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)
    canvas.addEventListener('touchcancel', onEnd)
    return () => {
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
      canvas.removeEventListener('touchcancel', onEnd)
    }
  }, [mode, gl])

  // ---------------- movement loop ----------------
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    let mx = 0
    let mz = 0
    if (activeRef.current) {
      const k = keys.current
      if (k.KeyW || k.ArrowUp) mz += 1
      if (k.KeyS || k.ArrowDown) mz -= 1
      if (k.KeyA || k.ArrowLeft) mx -= 1
      if (k.KeyD || k.ArrowRight) mx += 1
      const ti = touchInput?.current
      if (ti) {
        mx += ti.x || 0
        mz += ti.y || 0
        if (ti.jump && grounded.current) {
          vy.current = JUMP_V
          grounded.current = false
          playSfx('step', soundRef.current)
        }
        ti.jump = false
      }
      if (k.Space && grounded.current) {
        vy.current = JUMP_V
        grounded.current = false
        playSfx('step', soundRef.current)
      }
    }
    const len = Math.hypot(mx, mz)
    let vx = 0
    let vz = 0
    if (len > 0.01) {
      if (len > 1) {
        mx /= len
        mz /= len
      }
      const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? RUN : SPEED
      const fx = -Math.sin(yaw.current)
      const fz = -Math.cos(yaw.current)
      const rx = Math.cos(yaw.current)
      const rz = -Math.sin(yaw.current)
      vx = (fx * mz + rx * mx) * speed
      vz = (fz * mz + rz * mx) * speed
    }

    // --- move with fence collision (enter/exit via the south gate) ---
    const p = pos.current
    const x0 = p.x
    const z0 = p.z
    p.x = clamp(x0 + vx * dt, -BOUNDS, BOUNDS)
    const wasIn = Math.abs(x0) < FENCE && Math.abs(z0) < FENCE
    const nowInX = Math.abs(p.x) < FENCE && Math.abs(z0) < FENCE
    if (wasIn !== nowInX) p.x = x0 // hit east/west fence line
    const z1 = p.z
    p.z = clamp(z0 + vz * dt, -BOUNDS, BOUNDS)
    const nowIn = Math.abs(p.x) < FENCE && Math.abs(p.z) < FENCE
    if (nowInX !== nowIn) {
      const viaGate = Math.abs(p.x) < GATE && p.z > 0
      if (!viaGate) p.z = z1 // hit north/south fence (except the gate)
    }

    // footsteps
    if (grounded.current && (vx !== 0 || vz !== 0)) {
      stepAcc.current += Math.hypot(vx, vz) * dt
      if (stepAcc.current > 2.2) {
        stepAcc.current = 0
        playSfx('step', soundRef.current)
      }
    }

    // jump gravity
    if (!grounded.current) {
      vy.current -= 15 * dt
      p.y += vy.current * dt
      if (p.y <= EYE) {
        p.y = EYE
        vy.current = 0
        grounded.current = true
      }
    }

    camera.position.copy(p)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })

  return null
}
