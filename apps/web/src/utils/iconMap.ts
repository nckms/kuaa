const ICONS: Record<string, string> = {
  lang: 'bi-translate',
  math: 'bi-calculator',
  science: 'bi-flask',
  humanities: 'bi-bank',
  write: 'bi-pencil-square',
  world: 'bi-globe2',
}

export function getIcon(iconSlug: string): string {
  return ICONS[iconSlug] ?? 'bi-book'
}
