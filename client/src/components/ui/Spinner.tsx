import { cn } from '../../lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeMap = {
    sm: 'w-[14px] h-[14px] border-2',
    md: 'w-[20px] h-[20px] border-2',
    lg: 'w-[32px] h-[32px] border-[3px]',
  }

  return (
    <span
      className={cn(
        "inline-block rounded-full border-t-transparent animate-spin flex-shrink-0",
        "border-[#DFE104]",
        sizeMap[size],
        className
      )}
      aria-label="Loading"
    />
  )
}
