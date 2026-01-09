import { cn } from "@/lib/utils"

/**
 * Skeleton Component
 * 
 * Loading placeholder component for better UX.
 * Shows animated placeholders while data is loading.
 * 
 * @example
 * <Skeleton className="h-12 w-full" />
 * <Skeleton className="h-4 w-3/4" />
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#E5E5E0]", className)}
      {...props}
    />
  )
}

export { Skeleton }
