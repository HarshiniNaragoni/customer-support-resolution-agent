import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 shadow-glow-sm hover:shadow-glow",
        secondary: "bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/30",
        accent: "bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30",
        ghost: "hover:bg-white/5 text-text-secondary hover:text-text-primary",
        outline: "border border-glass-border bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary",
        danger: "bg-danger/20 text-danger hover:bg-danger/30 border border-danger/30",
        success: "bg-success/20 text-success hover:bg-success/30 border border-success/30",
        glass: "glass glass-hover text-text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
