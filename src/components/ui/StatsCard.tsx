"use client";

import { ReactNode, useEffect, useState } from "react";

interface StatsCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: "primary" | "secondary" | "success" | "warning";
  className?: string;
  isCurrency?: boolean;
}

const colorStyles = {
  primary: {
    bg: "bg-gradient-to-br from-[#E60028]/10 to-[#E60028]/5",
    border: "border-[#E60028]/20",
    icon: "bg-gradient-primary text-white",
    text: "text-[#E60028]",
  },
  secondary: {
    bg: "bg-gradient-to-br from-black/[0.06] to-black/[0.03]",
    border: "border-black/10",
    icon: "bg-gradient-secondary text-white",
    text: "text-black",
  },
  success: {
    bg: "bg-gradient-to-br from-green-500/10 to-green-500/5",
    border: "border-green-500/20",
    icon: "bg-gradient-success text-white",
    text: "text-green-600",
  },
  warning: {
    bg: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5",
    border: "border-yellow-500/20",
    icon: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    text: "text-yellow-600",
  },
};

export function StatsCard({
  label,
  value,
  icon,
  trend,
  color = "primary",
  className = "",
  isCurrency = false,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const styles = colorStyles[color];

  // Count-up animation
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`group animate-scale-in overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-black/70">
            {label}
          </p>
          <p className={`mt-3 font-serif text-4xl font-bold ${styles.text} transition-all duration-300 group-hover:scale-105`}>
            {isCurrency ? `${displayValue.toLocaleString("vi-VN")} VND` : displayValue.toLocaleString()}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-bold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}{trend.label ? "" : "%"}
              </span>
              <span className="text-xs text-black/70">{trend.label ?? "vs last month"}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.icon} shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
