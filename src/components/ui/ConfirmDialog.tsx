"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: "alert-circle" as const,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonVariant: "danger" as const,
    },
    warning: {
      icon: "alert-circle" as const,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      buttonVariant: "primary" as const,
    },
    info: {
      icon: "info" as const,
      iconBg: "bg-black/[0.06]",
      iconColor: "text-black",
      buttonVariant: "primary" as const,
    },
  };

  const style = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${style.iconBg}`}>
          <Icon name={style.icon} size={32} className={style.iconColor} />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold text-black">{title}</h3>

        {/* Message */}
        <p className="mt-3 text-sm leading-relaxed text-[#776D63]">{message}</p>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={style.buttonVariant}
            onClick={handleConfirm}
            loading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
