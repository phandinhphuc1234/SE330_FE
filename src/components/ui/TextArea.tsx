"use client";

import { TextareaHTMLAttributes, useId, useState } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export function TextArea({
  label,
  error,
  helperText,
  showCharCount = false,
  resize = "vertical",
  className = "",
  id,
  maxLength,
  value,
  onChange,
  ...props
}: TextAreaProps) {
  const [charCount, setCharCount] = useState(
    typeof value === "string" ? value.length : 0
  );

  const generatedId = useId();
  const textareaId = id || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  const resizeClasses = {
    none: "resize-none",
    vertical: "resize-y",
    horizontal: "resize-x",
    both: "resize",
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-bold text-[#2B2723]"
        >
          {label}
        </label>
      )}

      {/* TextArea */}
      <textarea
        id={textareaId}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        className={`
          w-full min-h-[120px] rounded-xl border bg-[#FFFCF5] px-4 py-3 text-[#171412] outline-none
          transition-all duration-200
          ${resizeClasses[resize]}
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
              : "border-[#D8CCBC] focus:border-[#7A263A] focus:shadow-[0_0_0_4px_rgba(122,38,58,0.1)]"
          }
          ${props.disabled ? "bg-gray-100 cursor-not-allowed" : ""}
        `}
        {...props}
      />

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="absolute bottom-3 right-3 text-xs font-semibold text-[#776D63]">
          {charCount}/{maxLength}
        </div>
      )}

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
