import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function PrimaryButton({
  children,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5",
        "bg-gradient-to-r from-[#6366F1] to-[#4F46E5]",
        "text-sm font-semibold text-white shadow-sm",
        "hover:shadow-md hover:-translate-y-[1px] transition-all",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

