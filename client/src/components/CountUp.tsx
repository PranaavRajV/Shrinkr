import { useCountUp } from '../hooks/useCountUp'

export default function CountUp({ value, duration = 1200 }: { value: number, duration?: number }) {
  const count = useCountUp(value, duration)
  return <span>{count.toLocaleString()}</span>
}
