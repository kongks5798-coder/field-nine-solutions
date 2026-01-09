import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button component variants
 * - default: Primary green button (Field Nine brand color)
 * - outline: Bordered button
 * - ghost: Transparent button
 * - destructive: Red button for dangerous actions
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#1A5D3F] text-white hover:bg-[#1A5D3F]/90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[#E5E5E0] bg-white hover:bg-[#F5F5F5] hover:text-[#171717]",
        secondary: "bg-[#F5F5F5] text-[#171717] hover:bg-[#E5E5E0]",
        ghost: "hover:bg-[#F5F5F5] hover:text-[#171717]",
        link: "text-[#1A5D3F] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Button Component
 * 
 * A flexible button component with multiple variants and sizes.
 * Used throughout the app for all button interactions.
 * 
 * @example
 * <Button variant="default" size="lg">Click me</Button>
 * <Button variant="outline" onClick={handleClick}>Cancel</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
