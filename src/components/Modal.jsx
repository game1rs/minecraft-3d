import { X } from 'lucide-react'

// Base modal: rounded panel, blurred backdrop, closes on backdrop click / Esc.
export default function Modal({ title, icon: Icon, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        } max-h-[88dvh] flex flex-col rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 shadow-2xl border-4 border-amber-200/80 fx-pop`}
      >
        <header className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b-2 border-amber-200">
          {Icon && (
            <span className="grid place-items-center w-9 h-9 rounded-2xl bg-amber-200 text-amber-800 shrink-0">
              <Icon size={19} />
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-extrabold text-amber-900 flex-1 truncate">{title}</h2>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="grid place-items-center w-8 h-8 rounded-full bg-white/80 text-slate-500 hover:bg-rose-100 hover:text-rose-600 border border-slate-200 transition"
          >
            <X size={17} />
          </button>
        </header>
        <div className="overflow-y-auto nice-scroll px-4 sm:px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
