"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

export type ToastType = "info" | "success" | "error" | "warning";

export interface ToastProps {
  id: number;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: number) => void;
}

export function Toast({
  id,
  message,
  type = "info",
  duration = 5000,
  action,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeStyles = {
    info: {
      bg: "bg-black",
      icon: "info" as const,
      progressBg: "bg-white/55",
    },
    success: {
      bg: "bg-[#28A745]",
      icon: "check" as const,
      progressBg: "bg-[#4CAF50]",
    },
    error: {
      bg: "bg-[#7A263A]",
      icon: "alert-circle" as const,
      progressBg: "bg-[#FF4458]",
    },
    warning: {
      bg: "bg-[#FAC801]",
      icon: "alert-circle" as const,
      progressBg: "bg-[#FDD835]",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`animate-toast-slide-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl ${style.bg} p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon name={style.icon} size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-relaxed">{message}</p>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose(id);
            }}
            className="mt-2 text-sm font-bold underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/20"
        aria-label="Close notification"
      >
        <Icon name="x" size={18} />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-xl bg-black/20">
          <div
            className={`h-full ${style.progressBg} animate-[progress-shrink_${duration}ms_linear]`}
            style={{
              animation: `progress-shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}
