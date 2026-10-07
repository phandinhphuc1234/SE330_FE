"use client";

interface CircularProgressProps {
  value?: number;
  indeterminate?: boolean;
  size?: number;
  strokeWidth?: number;
  color?: "primary" | "secondary" | "success" | "error";
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value = 0,
  indeterminate = false,
  size = 48,
  strokeWidth = 4,
  color = "primary",
  showLabel = false,
  className = "",
}: CircularProgressProps) {
  const colorClasses = {
    primary: "#7A263A",
    secondary: "#2B2723",
    success: "#28A745",
    error: "#DC3545",
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className={indeterminate ? "animate-spin" : ""}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#DED5C8"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorClasses[color]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
            strokeLinecap="round"
            className={indeterminate ? "" : "transition-all duration-300 ease-out"}
          />
        </svg>
        {showLabel && !indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-[#5F574F]">{clampedValue}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
