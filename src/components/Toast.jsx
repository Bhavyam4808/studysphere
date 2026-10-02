import React from 'react';
import { Icons } from './Icons.js';

/**
 * Toast Component
 * ===============
 * Floating notification banner for responsive user feedback.
 */
export function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium transition-all transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-900 text-white border-emerald-800'
                : isError
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 mr-2">
              {isSuccess && <Icons.CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isError && <Icons.Shield className="w-4 h-4 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Icons.Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
