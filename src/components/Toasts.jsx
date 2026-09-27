import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react'

const TONE_STYLE = {
  success: { icon: CheckCircle2, cls: 'bg-emerald-600' },
  info: { icon: Info, cls: 'bg-sky-600' },
  warn: { icon: AlertTriangle, cls: 'bg-amber-500' },
  error: { icon: XCircle, cls: 'bg-rose-600' },
}

// Top-center toast stack (event alerts, purchases, sales, errors…).
export default function Toasts({ toasts }) {
  return (
    <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none px-3 w-full max-w-md">
      {toasts.map((t) => {
        const T = TONE_STYLE[t.tone] || TONE_STYLE.info
        return (
          <div
            key={t.id}
            className={`fx-toast flex items-center gap-2 rounded-2xl ${T.cls} text-white px-4 py-2 shadow-xl font-extrabold text-xs sm:text-sm text-center`}
          >
            <T.icon size={16} className="shrink-0" />
            {t.text}
          </div>
        )
      })}
    </div>
  )
}
