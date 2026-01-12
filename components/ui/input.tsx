import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input Component
 * 
 * A styled input field for forms throughout the app.
 * Supports all standard HTML input attributes.
 * 
 * @example
 * <Input type="text" placeholder="Enter product name" />
 * <Input type="number" value={price} onChange={handleChange} />
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#171717] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#171717]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c2c2c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
