import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { EMPTY_ART_SET, loadArtSet, type ArtSet } from './artSet'

const ArtContext = createContext<ArtSet>(EMPTY_ART_SET)

/** Осигурява изображенията на една игра (папка public/kg/art/<game>/). */
export function ArtProvider({ game, children }: { game: string; children: ReactNode }) {
  const [set, setSet] = useState<ArtSet>(EMPTY_ART_SET)
  useEffect(() => {
    let alive = true
    loadArtSet(game).then((s) => alive && setSet(s))
    return () => {
      alive = false
    }
  }, [game])
  return <ArtContext.Provider value={set}>{children}</ArtContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useArt = () => useContext(ArtContext)

/**
 * Изображение от художествения набор; ако файлът още липсва — резервната векторна рисунка.
 * Изображението запълва своя контейнер (object-fit: contain), подравнено долу в центъра.
 */
export function Sprite({ name, fallback, className = '' }: { name: string; fallback: ReactNode; className?: string }) {
  const art = useArt()
  const url = art.url(name)
  if (!url) return <>{fallback}</>
  return <img src={url} alt="" aria-hidden="true" draggable={false} decoding="async" className={`kg-sprite ${className}`} data-sprite={name} />
}
