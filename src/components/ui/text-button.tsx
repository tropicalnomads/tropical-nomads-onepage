import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type TextButtonProps = React.ComponentProps<typeof Link> & {
  className?: string
}

export function TextButton({ className, children, ...props }: TextButtonProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer",
        className
      )}
    >
      {children}
    </Link>
  )}


