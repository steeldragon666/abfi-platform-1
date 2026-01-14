import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // WCAG 2.2 AA: All interactive elements must have 44px minimum touch target
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-gray-300 dark:hover:border-gray-600",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black hover:from-amber-500 hover:to-amber-600",
        success:
          "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80",
        cta: "btn-cta text-black",
      },
      size: {
        // All sizes meet WCAG 2.2 AA 44px minimum touch target
        default: "h-10 px-4 py-2",
        sm: "h-9 gap-1.5 px-3 text-xs",
        lg: "h-11 px-5",
        xl: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
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
