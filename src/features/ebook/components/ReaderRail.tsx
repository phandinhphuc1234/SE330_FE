"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** A persistent desktop rail; a focus-contained, dismissible dialog on small screens. */
export function ReaderRail({
  open,
  compact,
  label,
  className,
  onClose,
  children,
}: {
  open: boolean;
  compact: boolean;
  label: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open || !compact) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const root = railRef.current;
    const selector =
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]';
    root?.querySelector<HTMLElement>(selector)?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        root?.querySelectorAll<HTMLElement>(selector) ?? [],
      ).filter((item) => item.getClientRects().length);
      const first = focusable[0],
        last = focusable.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open, compact]);
  return (
    <div
      ref={railRef}
      className={className}
      data-open={open}
      role={compact && open ? "dialog" : "complementary"}
      aria-modal={compact && open ? true : undefined}
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </div>
  );
}
