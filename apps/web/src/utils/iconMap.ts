const ICONS: Record<string, string> = {
  lang: '📖',
  math: '📐',
  science: '🔬',
  humanities: '🌍',
  write: '✏️',
  world: '🌐',
}

export function getIcon(iconSlug: string): string {
  return ICONS[iconSlug] ?? '📚'
}
