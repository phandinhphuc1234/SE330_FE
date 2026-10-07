"use client";

import { ReactNode } from "react";

type EmptyStateVariant = "default" | "search" | "error" | "success";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-gray-100",
    iconColor: "text-gray-400",
    titleColor: "text-black",
  },
  search: {
    iconBg: "bg-black/[0.04]",
    iconColor: "text-black",
    titleColor: "text-black",
  },
  error: {
    iconBg: "bg-red-50",
    iconColor: "text-[#7A263A]",
    titleColor: "text-[#7A263A]",
  },
  success: {
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    titleColor: "text-green-700",
  },
};

const defaultIcons = {
  default: (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  search: (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  error: (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  success: (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  const defaultIcon = defaultIcons[variant];

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] px-6 py-16 text-center shadow-[0_12px_32px_rgba(43,39,35,0.06)] ${className}`}>
      {/* Icon */}
      <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${styles.iconBg} animate-scale-in`}>
        <div className={styles.iconColor}>
          {icon || defaultIcon}
        </div>
      </div>

      {/* Title */}
      <h3 className={`animate-fade-up font-serif text-2xl font-semibold ${styles.titleColor} animate-delay-75`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="animate-fade-up mt-2 max-w-md text-sm leading-relaxed text-black/70 animate-delay-150">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="animate-fade-up mt-6 animate-delay-225">
          {action}
        </div>
      )}
    </div>
  );
}
