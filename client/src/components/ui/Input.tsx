import * as React from 'react'

type InputProps = {
  label?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-label mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {prefix && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] pointer-events-none group-focus-within:text-[#DFE104] transition-colors duration-150 flex items-center justify-center">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={[
              'w-full h-[52px] min-h-[52px] bg-[#111111]',
              'border-none border-b-2 border-[#3F3F46]',
              'text-[15px] font-semibold text-[#FAFAFA]',
              'tracking-[-0.01em] font-[inherit]',
              'focus:outline-none focus:border-[#DFE104]',
              'transition-colors duration-150 px-4',
              'placeholder:text-[#3F3F46] placeholder:font-normal',
              error ? 'border-[#ef4444]' : '',
              prefix ? 'pl-11' : 'pl-4',
              suffix ? 'pr-11' : 'pr-4',
              className ?? '',
            ].join(' ')}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[#ef4444] text-[11px] uppercase font-bold tracking-[0.1em] mt-2">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
