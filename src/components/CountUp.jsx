import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils'

export default function CountUp({ end, duration = 300, isIncognito = false }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime = null
    const startValue = count
    const step = timestamp => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * (end - startValue) + startValue))
      if (progress < 1) window.requestAnimationFrame(step)
    }
    window.requestAnimationFrame(step)
  }, [end, duration])
  return <span>{formatCurrency(count, isIncognito)}</span>
}
