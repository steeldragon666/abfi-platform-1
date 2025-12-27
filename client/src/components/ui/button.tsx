import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // WCAG 2.2 AA: All interactive elements must have 44px minimum touch target
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-[#D4AF37]-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-[transform,box-shadow,background-color] duration-150",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-destructive/40 transition-[transform,box-shadow,background-color] duration-150",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-[transform,border-color,background-color] duration-150",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-[transform,background-color] duration-150",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground transition-[background-color,color] duration-150",
        link: "text-[#D4AF37] underline-offset-4 hover:underline transition-colors duration-150",
        premium:
          "bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black shadow-md hover:shadow-lg hover:from-amber-400 hover:to-amber-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] btn-glow transition-[transform,box-shadow] duration-150",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-[transform,box-shadow,background-color] duration-150",
        cta: "btn-cta text-black font-semibold hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      },
      size: {
        // All sizes now meet WCAG 2.2 AA 44px minimum touch target
        default: "h-11 px-4 py-2.5",
        sm: "h-11 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
        icon: "size-11",
        "icon-sm": "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        data-slot="button"
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        <Slottable>{children}</Slottable>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
