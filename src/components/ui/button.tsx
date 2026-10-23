import type { ComponentProps } from "react";

export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      data-slot="button"
      className={`inline-flex h-11 items-center justify-center gap-3 rounded-control border border-accent bg-transparent px-5 text-[13px] font-semibold text-accent-text transition-colors duration-150 hover:bg-accent/12 hover:text-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-45 ${className}`}
      {...props}
    />
  );
}
