"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Enhanced Button Component with Loading States
 */
export function Button({
  variant = "primary",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "px-6 py-3 font-bold rounded transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-correct hover:bg-correct/90 text-white hover:scale-105 active:scale-95",
    secondary: "bg-border hover:bg-border/80 text-white hover:scale-105 active:scale-95",
    danger: "bg-absent hover:bg-absent/90 text-white hover:scale-105 active:scale-95",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

/**
 * Spinner Component for Loading States
 */
function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Icon Button Component
 */
export function IconButton({
  icon,
  loading = false,
  variant = "secondary",
  className = "",
  ...props
}: Omit<ButtonProps, "children"> & { icon: ReactNode }) {
  const baseStyles = "p-3 font-bold rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-correct hover:bg-correct/90 text-white hover:scale-110 active:scale-95",
    secondary: "bg-border hover:bg-border/80 text-white hover:scale-110 active:scale-95",
    danger: "bg-absent hover:bg-absent/90 text-white hover:scale-110 active:scale-95",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
    </button>
  );
}
