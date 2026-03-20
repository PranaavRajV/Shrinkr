import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BadgeProps = {
  variant?: 'active' | 'expired' | 'warning' | 'neutral'
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export const Badge = ({ variant = 'neutral', className, children, ...props }: BadgeProps) => {
  const variants = {
    active:  "bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/20",
    expired: "bg-red-500/10 text-red-400 border border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-red-500/20",
    neutral: "bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]"
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs uppercase tracking-widest font-bold border-radius-0 !rounded-none", 
        variants[variant], 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}
