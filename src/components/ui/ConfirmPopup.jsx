export function ConfirmPopup({ message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border border-stone-200">
        <p className="text-stone-800 text-sm mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 ${danger ? "bg-rose-500 hover:bg-rose-400" : "bg-stone-900 hover:bg-stone-700"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
