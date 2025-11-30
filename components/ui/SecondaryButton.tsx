import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function SecondaryButton({
  children,
  className,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center px-4 rounded-[10px]",
        "bg-white border border-gray-300",
        "text-sm font-medium text-gray-700",
        "hover:bg-gray-50 hover:border-gray-400 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

