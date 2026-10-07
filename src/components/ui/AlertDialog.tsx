"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: "success" | "error" | "warning" | "info";
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  variant = "info",
}: AlertDialogProps) {
  const variantStyles = {
    success: {
      icon: "check" as const,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    error: {
      icon: "x" as const,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    warning: {
      icon: "alert-circle" as const,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    info: {
      icon: "info" as const,
      iconBg: "bg-black/[0.06]",
      iconColor: "text-black",
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${style.iconBg}`}>
          <Icon name={style.icon} size={32} className={style.iconColor} />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold text-black">{title}</h3>

        {/* Message */}
        <p className="mt-3 text-sm leading-relaxed text-[#776D63]">{message}</p>

        {/* Action */}
        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
