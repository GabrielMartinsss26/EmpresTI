import type { ComponentProps } from "react";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={`h-[42px] w-full rounded-control border border-border bg-sunken px-3 text-sm text-foreground placeholder:text-faint disabled:opacity-45 aria-invalid:border-error ${className}`}
      {...props}
    />
  );
}
