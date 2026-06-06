"use client";

import toast from "react-hot-toast";

interface ToastConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function toastConfirm({
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ToastConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          className={`pointer-events-auto w-[min(100vw-2rem,22rem)] rounded-xl border border-surface-border bg-white p-4 shadow-lg ${
            t.visible ? "animate-fade-in" : "opacity-0"
          }`}
          role="alertdialog"
          aria-labelledby={`toast-confirm-${t.id}`}
        >
          <p
            id={`toast-confirm-${t.id}`}
            className="text-sm font-medium leading-relaxed text-slate-800"
          >
            {message}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className={
                destructive
                  ? "rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  : "btn-primary !px-4 !py-2 text-sm"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" },
    );
  });
}
