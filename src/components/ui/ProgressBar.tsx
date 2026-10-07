"use client";

interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  color?: "primary" | "secondary" | "success" | "error";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  color = "primary",
  size = "md",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const colorClasses = {
    primary: "bg-[#7A263A]",
    secondary: "bg-black",
    success: "bg-[#28A745]",
    error: "bg-[#DC3545]",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className}>
      {showLabel && !indeterminate && (
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-black/75">
          <span>Progress</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-[#DED5C8] ${sizeClasses[size]}`}>
        {indeterminate ? (
          <div className="relative h-full w-full">
            <div
              className={`absolute h-full w-1/4 animate-[progress-indeterminate_1.5s_ease-in-out_infinite] ${colorClasses[color]}`}
            />
          </div>
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  );
}
