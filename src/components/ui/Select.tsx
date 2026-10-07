"use client";

import { SelectHTMLAttributes, ReactNode, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  floatingLabel?: boolean;
}

export function Select({
  label,
  error,
  helperText,
  leftIcon,
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-sm font-bold text-[#2B2723]"
        >
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#776D63] pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Select */}
        <select
          id={selectId}
          className={`
            w-full h-12 rounded-xl border bg-[#FFFCF5] px-4 text-[#171412] outline-none
            appearance-none cursor-pointer
            transition-all duration-200
            ${leftIcon ? "pl-12" : ""}
            pr-10
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                : "border-[#D8CCBC] focus:border-[#7A263A] focus:shadow-[0_0_0_4px_rgba(122,38,58,0.1)]"
            }
            ${props.disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          `}
          {...props}
        >
          {children}
        </select>

        {/* Dropdown Arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#776D63]">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <p
          className={`mt-2 text-xs font-semibold ${
            error ? "text-red-600 animate-fade-up" : "text-[#776D63]"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
