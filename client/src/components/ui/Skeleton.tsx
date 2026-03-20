import { cn } from '../../lib/utils'

interface SkeletonProps {
  width?: string
  height?: string
  variant?: 'text' | 'rect' | 'circle'
  className?: string
}

export const Skeleton = ({ width, height, variant = 'rect', className }: SkeletonProps) => (
  <div
    className={cn(
      "animate-shimmer bg-[#27272A]",
      variant === 'text'   && "h-4",
      variant === 'circle' && "rounded-full",
      className
    )}
    style={{
      width:  width  || (variant === 'circle' ? '44px' : '100%'),
      height: height || (variant === 'circle' ? '44px' : undefined),
    }}
  />
)
