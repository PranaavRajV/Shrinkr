import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  isLoading: boolean
  isSuccess?: boolean
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: any
}

export default function SubmitButton({ isLoading, isSuccess, children, onClick, disabled, style }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={{
        ...style,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Loader2 className="animate-spin" size={18} />
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Check size={18} />
          </motion.div>
        ) : (
          <motion.div
            key="children"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
