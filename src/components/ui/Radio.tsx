"use client";

import { InputHTMLAttributes, ReactNode, useId } from "react";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
}

export function Radio({
  label,
  error,
  helperText,
  size = "md",
  className = "",
  id,
  ...props
}: RadioProps) {
  const generatedId = useId();
  const radioId = id || generatedId;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const dotSizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        {/* Radio */}
        <div className="relative flex items-center">
          <input
            type="radio"
            id={radioId}
            className={`
              ${sizeClasses[size]}
              appearance-none rounded-full border-2 border-[#D8CCBC] bg-white
              cursor-pointer transition-all duration-200
              checked:border-[#7A263A]
              hover:border-black
              focus:outline-none focus:ring-4 focus:ring-black/10
              disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300
              ${error ? "border-red-500" : ""}
            `}
            {...props}
          />

          {/* Inner Dot */}
          <span
            className={`
              ${dotSizeClasses[size]}
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              rounded-full bg-[#7A263A] pointer-events-none
              transition-all duration-200
              ${props.checked ? "scale-100 opacity-100" : "scale-0 opacity-0"}
            `}
          />
        </div>

        {/* Label */}
        {label && (
          <label
            htmlFor={radioId}
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
