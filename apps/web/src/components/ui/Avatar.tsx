interface Props {
  size?: number
  name?: string
  hue?: number
  ring?: boolean
}

export default function Avatar({ size = 36, name = '', hue = 0, ring = false }: Props) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const gradients = [
    'linear-gradient(135deg,#FFDC5C,#840033)',
    'linear-gradient(135deg,#531A61,#FFDC5C)',
    'linear-gradient(135deg,#840033,#531A61)',
    'linear-gradient(135deg,#FFDC5C,#531A61)',
    'linear-gradient(135deg,#840033,#FFDC5C)',
    'linear-gradient(135deg,#2a0d33,#FFDC5C)',
  ]

  const inner = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradients[hue % gradients.length],
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontFamily: "'Unbounded', sans-serif",
        fontWeight: 600,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )

  if (!ring) return inner

  return (
    <div
      style={{
        padding: 2,
        borderRadius: '50%',
        background:
          'conic-gradient(from 180deg at 50% 50%, #FFDC5C, #840033, #531A61, #FFDC5C)',
        flexShrink: 0,
      }}
    >
      {inner}
    </div>
  )
}
