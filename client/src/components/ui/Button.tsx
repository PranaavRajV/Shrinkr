import { cn } from '../../lib/utils'
import { Spinner } from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-[#DFE104] text-black border-2 border-[#DFE104] hover:bg-black hover:text-[#DFE104]',
    outline: 'bg-transparent border-2 border-[#3F3F46] text-[#FAFAFA] hover:border-[#DFE104] hover:text-[#DFE104]',
    ghost:   'bg-transparent border border-transparent text-[#A1A1AA] hover:text-[#DFE104] hover:border-[#3F3F46]',
  }

  const sizes = {
    sm: 'h-10 px-6 text-[11px]',
    md: 'h-[52px] px-8 text-[13px]',
    lg: 'h-[60px] px-12 text-[15px]',
  }

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "font-bold uppercase tracking-[0.082em] whitespace-nowrap",
        "transition-all duration-150 cursor-pointer overflow-hidden",
        "active:scale-[0.97]",
        variants[variant],
        sizes[size],
        loading  && "opacity-70 pointer-events-none",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>LOADING...</span>
        </>
      ) : children}
    </button>
  )
}
