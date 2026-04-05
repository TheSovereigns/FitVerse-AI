import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 aria-invalid:ring-destructive/20 shadow-xl border border-white/10 hover:scale-[1.05] active:scale-90 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-[0_10px_30px_-10px_rgba(255,149,0,0.6)] hover:bg-primary/90 hover:shadow-[0_15px_40px_-10px_rgba(255,149,0,0.8)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        outline:
          "glass border-white/20 hover:bg-white/10 text-foreground",
        secondary:
          "bg-white/10 dark:bg-black/40 text-foreground hover:bg-white/20 backdrop-blur-3xl",
        ghost:
          "border-transparent bg-transparent hover:bg-white/10 text-foreground shadow-none backdrop-blur-none",
        link: "text-foreground underline-offset-4 hover:underline border-transparent shadow-none backdrop-blur-none hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-14 px-10",
        sm: "h-11 px-6",
        lg: "h-16 px-12 text-sm",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
