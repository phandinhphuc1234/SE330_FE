import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  children: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-[#FFFCF5] border border-[#DED5C8]",
    bordered: "bg-[#FFFCF5] border border-[#CBBDAA]",
    elevated: "bg-[#FFFCF5] border border-[#DED5C8] shadow-[0_14px_38px_rgba(43,39,35,0.08)]",
    gradient: "bg-gradient-to-br from-[#FFFCF5] to-[#F1EADF] border border-[#DED5C8]",
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClasses = hover
    ? "cursor-pointer transition-all duration-300 hover:border-[#CBBDAA] hover:shadow-[0_18px_40px_rgba(43,39,35,0.12)]"
    : "";

  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function CardTitle({
  as: Component = "h3",
  className = "",
  children,
  ...props
}: CardTitleProps) {
  return (
    <Component className={`text-xl font-bold text-black ${className}`} {...props}>
      {children}
    </Component>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ className = "", children, ...props }: CardDescriptionProps) {
  return (
    <p className={`mt-2 text-sm leading-6 text-black/70 ${className}`} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
