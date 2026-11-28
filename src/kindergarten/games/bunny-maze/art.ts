/**
 * Каталог на художествените ресурси за „Приказният лабиринт“ (папка public/kg/art/bunny-maze/).
 * Всяко изображение е изрязано така, че котвата (земята, долу в средата) е в средата на долния ръб.
 * aspect = ширина / височина на готовия файл; по него се изчислява размерът в сцената.
 * Ресурс, който липсва в manifest.json, се показва със сегашната векторна рисунка (MazeArt.tsx).
 */
export const ART_GAME = 'bunny-maze'

export interface MazeArtResource {
  name: string
  /** ширина / височина на готовия файл (0 — още не е готов) */
  aspect: number
  transparent: boolean
  note: string
  /** основен (лист 1–7) или допълнителен (лист 8) */
  core: boolean
}

export const MAZE_ART: MazeArtResource[] = [
  { name: 'bg-garden', aspect: 1, transparent: false, core: true, note: 'общ фон на мисиите (квадрат, изрязва се за всеки екран)' },
  { name: 'bg-home', aspect: 1.7768, transparent: false, core: true, note: 'фон на финала: залезната градина (16:9, запълва екрана)' },
  { name: 'bunny-idle', aspect: 0.6868, transparent: true, core: true, note: 'зайчето спокойно' },
  { name: 'bunny-happy', aspect: 0.6868, transparent: true, core: true, note: 'зайчето радостно' },
  { name: 'hedge', aspect: 2.0785, transparent: true, core: true, note: 'отрязък жив плет' },
  { name: 'bush', aspect: 1.3131, transparent: true, core: true, note: 'храст' },
  { name: 'hill-tree', aspect: 0.825, transparent: true, core: true, note: 'дърво на хълмче (мисия 1, горе)' },
  { name: 'pond', aspect: 1.8848, transparent: true, core: true, note: 'езерце (мисия 1, долу)' },
  { name: 'mushroom', aspect: 0.8292, transparent: true, core: true, note: 'голямата гъба (мисия 2)' },
  { name: 'stone', aspect: 1.2865, transparent: true, core: true, note: 'камъче (мисия 4)' },
  { name: 'chick', aspect: 1.0333, transparent: true, core: true, note: 'пиленце (мисии 3 и 5, финал)' },
  { name: 'frog', aspect: 0.8889, transparent: true, core: true, note: 'жабче (мисии 4 и 5, финал)' },
  { name: 'basket', aspect: 0.9339, transparent: true, core: true, note: 'кошничка (мисия 2); предната част се изрязва по ръба' },
  { name: 'coop', aspect: 0.955, transparent: true, core: true, note: 'курничка (мисия 3)' },
  { name: 'fence', aspect: 1.3833, transparent: true, core: true, note: 'отрязък оградка (мисия 3): повтаря се около елипсата' },
  { name: 'squirrel', aspect: 1.2219, transparent: true, core: true, note: 'катеричка (мисия 2, финал); съкровището е в лапичките' },
  { name: 'gift-star', aspect: 1, transparent: true, core: true, note: 'златната звезда: напредъкът, вратата, картата, финала, подаръкът в мисия 5' },
  { name: 'home', aspect: 1.1077, transparent: true, core: true, note: 'приказният дом (финал, краят на картата на пътешествието)' },
  ...['door-frame', 'door-leaf', 'key', 'acorn', 'cone', 'gift-flower', 'gift-heart', 'gift-leaf'].map((name) => ({
    name,
    aspect: 0,
    transparent: true,
    core: true,
    note: 'предстои (сега — векторна рисунка)',
  })),
  ...['carrot', 'golden-carrot', 'cake', 'flower', 'home-small', 'sparkle'].map((name) => ({ name, aspect: 0, transparent: true, core: false, note: 'допълнителен (сега — векторна рисунка)' })),
]

const ASPECT = new Map(MAZE_ART.map((r) => [r.name, r.aspect]))
/** Съотношение ширина/височина на готовия файл. */
export const artAspect = (name: string) => ASPECT.get(name) || 1
