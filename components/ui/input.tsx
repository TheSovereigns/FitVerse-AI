import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/30 bg-white/5 dark:bg-white/5 h-14 w-full min-w-0 rounded-2xl px-5 py-3 text-base outline-none transition-all duration-300 border border-white/10 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-black disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-inner",
        "focus-visible:border-primary focus-visible:bg-white/10 dark:focus-visible:bg-white/10 focus-visible:ring-offset-0 focus-visible:ring-4 focus-visible:ring-primary/20",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
