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
          "flex h-10 w-full rounded-md border border-[#E5E5E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm text-[#171717] dark:text-[#F5F5F5] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6B6B6B] dark:placeholder:text-[#A3A3A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5D3F] dark:focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
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
