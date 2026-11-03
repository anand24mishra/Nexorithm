interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Modal({ isOpen, title, message, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nx-modal-title"
        className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-high p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="nx-modal-title" className="text-base font-bold text-on-surface">
          {title}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-error-container text-error"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
