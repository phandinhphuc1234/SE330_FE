"use client";

import { InputHTMLAttributes, ReactNode, useId } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
}

export function Checkbox({
  label,
  error,
  helperText,
  size = "md",
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            className={`
              ${sizeClasses[size]}
              appearance-none rounded border-2 border-[#D8CCBC] bg-white
              cursor-pointer transition-all duration-200
              checked:border-[#7A263A] checked:bg-[#7A263A]
              hover:border-black
              focus:outline-none focus:ring-4 focus:ring-black/10
              disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300
              ${error ? "border-red-500" : ""}
            `}
            {...props}
          />
          
          {/* Checkmark */}
          <svg
            className={`
              ${sizeClasses[size]}
              absolute left-0 top-0 pointer-events-none
              text-white opacity-0 transition-opacity duration-200
              ${props.checked ? "opacity-100" : ""}
            `}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Label */}
        {label && (
          <label
            htmlFor={checkboxId}
            className="cursor-pointer select-none text-sm font-semibold text-black/75 leading-tight"
          >
            {label}
          </label>
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
