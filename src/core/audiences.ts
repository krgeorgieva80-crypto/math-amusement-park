/**
 * Двата парка в приложението и техните аудитории.
 * Училищният парк е за 2.–4. клас; първи клас е предвиден, но още не е разработен
 * (добавя се, като се премести от `plannedGrades` в `grades` заедно със съдържанието си).
 */
export type ParkId = 'kindergarten' | 'school'

export const SCHOOL = {
  grades: [2, 3, 4] as const,
  /** Предвидени за бъдещо разширение — не се показват. */
  plannedGrades: [1] as const,
}

export const PARKS: { id: ParkId; title: string; audience: string }[] = [
  { id: 'kindergarten', title: 'Приказен математически парк', audience: 'Детска градина · 3–7 години' },
  { id: 'school', title: 'Математически увеселителен парк', audience: `Начално училище · ${SCHOOL.grades[0]}.–${SCHOOL.grades[SCHOOL.grades.length - 1]}. клас` },
]

/** Пряк избор на парк чрез адреса (?park=kindergarten или ?park=school) — за споделени връзки. */
export function parkFromUrl(): ParkId | null {
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search).get('park')
  return p === 'kindergarten' || p === 'school' ? p : null
}
