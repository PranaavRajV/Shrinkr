import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 text-center bg-[#09090B] selection:bg-[#DFE104] selection:text-black font-sans uppercase">
           <div className="border-4 border-red-500 bg-[#09090B] p-12 max-w-xl w-full relative group">
              <div className="absolute top-[-2rem] left-1/2 -translate-x-1/2 bg-[#09090B] px-4">
                 <AlertCircle size={48} className="text-red-500" />
              </div>
              
              <div className="text-[6rem] font-black text-red-500/10 leading-none mb-4 select-none">ERROR</div>
              <h2 className="text-3xl font-black text-[#FAFAFA] tracking-tighter mb-4">SYSTEM INTERRUPTED</h2>
              <p className="text-xs font-bold text-[#A1A1AA] tracking-widest mb-12 lowercase first-letter:uppercase">
                An unexpected error occurred while loading this module. Our team has been notified. We apologize for the inconvenience.
              </p>
              
              <Button size="lg" className="w-full h-16 bg-red-500 hover:bg-red-600 text-white" onClick={() => window.location.reload()}>
                <RotateCcw className="mr-2 h-5 w-5" /> REBOOT SYSTEM
              </Button>
           </div>
        </div>
      )
    }

    return this.props.children
  }
}
