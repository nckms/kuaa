interface Props {
  size?: number
  tone?: 'brand' | 'amber' | 'mono'
}

export default function AsaGlyph({ size = 32, tone = 'brand' }: Props) {
  const fills =
    tone === 'amber'
      ? { a: '#531A61', b: '#840033' }
      : tone === 'mono'
        ? { a: 'currentColor', b: 'currentColor' }
        : { a: '#531A61', b: '#840033' }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M6 46 C 16 28, 28 18, 58 10 C 50 22, 38 32, 22 40 C 14 44, 8 46, 6 46Z"
        fill={fills.a}
      />
      <path
        d="M14 52 C 22 40, 34 32, 56 24 C 48 38, 36 46, 22 52 C 18 54, 14 54, 14 52Z"
        fill={fills.b}
        opacity={tone === 'mono' ? 0.6 : 1}
      />
    </svg>
  )
}
