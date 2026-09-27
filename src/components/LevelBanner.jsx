import { fmt } from '../game/data'

// Big celebratory level-up banner.
export default function LevelBanner({ banner }) {
  if (!banner) return null
  return (
    <div className="fixed inset-x-0 top-1/4 z-[60] flex justify-center pointer-events-none px-4">
      <div className="fx-banner text-center rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-4 border-amber-200 px-8 py-4 shadow-2xl">
        <div className="text-3xl sm:text-4xl font-black text-amber-900 drop-shadow-sm">🎉 LEVEL UP!</div>
        <div className="text-base sm:text-lg font-extrabold text-amber-800">
          Level {banner.level} · bonus 🪙{fmt(banner.coins)} coins!
        </div>
      </div>
    </div>
  )
}
