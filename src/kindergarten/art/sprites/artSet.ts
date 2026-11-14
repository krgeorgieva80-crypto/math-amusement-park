/**
 * Художествена система на приказния парк: растерни изображения (WebP/PNG с прозрачност) по игри,
 * с резервна векторна графика, докато окончателните файлове не са готови.
 *
 * Всяка игра има своя папка public/kg/art/<игра>/ с manifest.json:
 *   { "files": { "<име на ресурс>": "<файл>.webp", ... } }
 * Ресурс, който липсва в манифеста, се показва с резервната (вградената SVG) рисунка.
 * Така изображенията се добавят постепенно, без промяна в кода.
 *
 * Системата е обща: „Нахрани трите мечета“ може по-късно да използва папка public/kg/art/feed-bears/.
 */

export interface ArtManifest {
  files: Record<string, string>
}

export interface ArtSet {
  /** Адрес на изображението или null, ако няма файл (тогава се показва резервната рисунка). */
  url(name: string): string | null
  has(name: string): boolean
  readonly count: number
}

const EMPTY: ArtSet = { url: () => null, has: () => false, count: 0 }

export function makeArtSet(base: string, manifest: ArtManifest | null): ArtSet {
  const files = manifest?.files ?? {}
  const dir = base.endsWith('/') ? base : base + '/'
  return {
    url: (name) => (files[name] ? dir + files[name] : null),
    has: (name) => Boolean(files[name]),
    count: Object.keys(files).length,
  }
}

const cache = new Map<string, Promise<ArtSet>>()

export const artBase = (game: string) => `${typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? '/') : '/'}kg/art/${game}/`

/** Зарежда манифеста веднъж и предварително зарежда изображенията, за да няма мигане при смяна на състоянията. */
export function loadArtSet(game: string, fetcher: (url: string) => Promise<ArtManifest | null> = defaultFetch): Promise<ArtSet> {
  let p = cache.get(game)
  if (!p) {
    const base = artBase(game)
    p = fetcher(base + 'manifest.json')
      .catch(() => null)
      .then((m) => {
        const set = makeArtSet(base, m)
        if (typeof Image !== 'undefined') for (const f of Object.values(m?.files ?? {})) new Image().src = base + f
        return set
      })
    cache.set(game, p)
  }
  return p
}

async function defaultFetch(url: string): Promise<ArtManifest | null> {
  const r = await fetch(url, { cache: 'no-cache' })
  if (!r.ok) return null
  return (await r.json()) as ArtManifest
}

export { EMPTY as EMPTY_ART_SET }
