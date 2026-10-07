"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  floatingLabel?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  floatingLabel = true,
  showClearButton = false,
  onClear,
  className = "",
  id,
  value,
  onChange,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  const generatedId = useId();
  const inputId = id || generatedId;
  const isFloating = floatingLabel && (isFocused || hasValue || value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(Boolean(e.target.value));
    onChange?.(e);
  };

  const handleClear = () => {
    setHasValue(false);
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`absolute left-0 transition-all duration-200 pointer-events-none ${
            floatingLabel
              ? isFloating
                ? "top-0 text-xs font-bold text-[#2B2723] -translate-y-full mb-2"
                : "top-1/2 -translate-y-1/2 left-4 text-sm text-[#776D63]"
              : "top-0 text-sm font-bold text-[#2B2723] -translate-y-full mb-2"
          } ${leftIcon && !isFloating ? "left-12" : ""}`}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#776D63]">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full h-12 rounded-xl border bg-[#FFFCF5] px-4 text-[#171412] outline-none
            transition-all duration-200
            ${leftIcon ? "pl-12" : ""}
            ${rightIcon || showClearButton ? "pr-12" : ""}
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                : "border-[#D8CCBC] focus:border-[#7A263A] focus:shadow-[0_0_0_4px_rgba(122,38,58,0.1)]"
            }
            ${props.disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          `}
          {...props}
        />

        {/* Right Icon or Clear Button */}
        {(rightIcon || (showClearButton && hasValue)) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {showClearButton && hasValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#776D63] hover:text-[#7A263A] transition-colors"
                tabIndex={-1}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              <div className="text-[#776D63]">{rightIcon}</div>
            )}
          </div>
        )}
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
