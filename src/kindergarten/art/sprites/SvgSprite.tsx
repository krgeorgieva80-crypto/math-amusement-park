import type { ReactNode } from 'react'
import { useArt } from './Sprite'

/**
 * Изображение от художествения набор вътре в SVG сцена (<image>). Ако файлът липсва — резервната векторна рисунка.
 * Поставя се в правоъгълник x, y, w, h (в мерните единици на сцената). Не приема докосвания:
 * взаимодействието остава на зоните на играта.
 */
export function SvgSprite({
  name,
  x,
  y,
  w,
  h,
  fallback,
  flip = false,
  fit = 'xMidYMax meet',
  className = '',
}: {
  name: string
  x: number
  y: number
  w: number
  h: number
  fallback: ReactNode
  flip?: boolean
  /** preserveAspectRatio; 'none' — за предмети, които може леко да се разтеглят (жив плет) */
  fit?: string
  className?: string
}) {
  const url = useArt().url(name)
  if (!url) return <>{fallback}</>
  return (
    <image
      href={url}
      x={x}
      y={y}
      width={w}
      height={h}
      preserveAspectRatio={fit}
      pointerEvents="none"
      className={`kg-sprite-svg ${className}`}
      data-sprite={name}
      transform={flip ? `translate(${2 * x + w} 0) scale(-1 1)` : undefined}
    />
  )
}
