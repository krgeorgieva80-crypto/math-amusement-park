import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Заглавие на един ред, което винаги се побира в рамката си: след изчертаване се мери
 * реалната ширина (с очертанието на буквите) и шрифтът се смалява само ако е нужно.
 */
export function FitText({ text, max, min = 14, className }: { text: string; max: number; min?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [px, setPx] = useState(max)
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return
    const fit = () => {
      const cs = getComputedStyle(box)
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const stroke = parseFloat(getComputedStyle(el).webkitTextStrokeWidth || '0') * 2
      let cur = max
      el.style.fontSize = `${cur}px`
      while (cur > min && el.scrollWidth + stroke + 4 > room) {
        cur -= 1
        el.style.fontSize = `${cur}px`
      }
      setPx(cur)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => ro.disconnect()
  }, [text, max, min])
  return (
    <span ref={ref} className={className} style={{ fontSize: px, whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }}>
      {text}
    </span>
  )
}
